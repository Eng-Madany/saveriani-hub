from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ================== MODELS ==================

class StaffMember(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    pin: str  # 4 digit PIN
    role: str = "operatore"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StaffCreate(BaseModel):
    name: str
    pin: str
    role: str = "operatore"

class TimeEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    staff_id: str
    staff_name: str
    entry_type: str  # "clock_in" or "clock_out"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TimeEntryCreate(BaseModel):
    staff_id: str
    staff_name: str
    entry_type: str

class LogEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # Medico, Sicurezza, Generale, Manutenzione
    content: str
    staff_id: str
    staff_name: str
    resident_id: Optional[str] = None
    resident_name: Optional[str] = None
    shift: str  # "mattina" or "notte"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LogEntryCreate(BaseModel):
    category: str
    content: str
    staff_id: str
    staff_name: str
    resident_id: Optional[str] = None
    resident_name: Optional[str] = None
    shift: str

class ShiftHandover(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    shift: str  # "mattina" or "notte"
    notes: str
    staff_id: str
    staff_name: str
    acknowledged_by: Optional[str] = None
    acknowledged_name: Optional[str] = None
    acknowledged_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ShiftHandoverCreate(BaseModel):
    date: str
    shift: str
    notes: str
    staff_id: str
    staff_name: str

class ShiftHandoverAcknowledge(BaseModel):
    staff_id: str
    staff_name: str

class MealRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    meal_type: str  # "pranzo", "cena", "colazione"
    meal_count: int
    quality_rating: int  # 1-5
    leftover_status: str  # "nessuno", "pochi", "molti"
    notes: Optional[str] = None
    staff_id: str
    staff_name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MealRecordCreate(BaseModel):
    date: str
    meal_type: str
    meal_count: int
    quality_rating: int
    leftover_status: str
    notes: Optional[str] = None
    staff_id: str
    staff_name: str

class Resident(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    surname: str
    name: str
    nationality: str
    room_number: int
    medical_alerts: List[str] = []
    security_notes: List[str] = []
    status: str = "presente"  # presente, assente, isolamento
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ResidentCreate(BaseModel):
    surname: str
    name: str
    nationality: str
    room_number: int
    medical_alerts: List[str] = []
    security_notes: List[str] = []
    status: str = "presente"

class ResidentUpdate(BaseModel):
    surname: Optional[str] = None
    name: Optional[str] = None
    nationality: Optional[str] = None
    room_number: Optional[int] = None
    medical_alerts: Optional[List[str]] = None
    security_notes: Optional[List[str]] = None
    status: Optional[str] = None

class LaundryScheduleEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    room_numbers: List[int]
    shift: int  # 1, 2, or 3
    completed: bool = False
    completed_by: Optional[str] = None
    completed_at: Optional[str] = None

class ExportData(BaseModel):
    staff: List[dict]
    residents: List[dict]
    time_entries: List[dict]
    log_entries: List[dict]
    shift_handovers: List[dict]
    meal_records: List[dict]
    laundry_schedule: List[dict]
    exported_at: str

# ================== STAFF ENDPOINTS ==================

@api_router.get("/")
async def root():
    return {"message": "Camp Management System API - Saveriani"}

@api_router.post("/staff", response_model=StaffMember)
async def create_staff(input: StaffCreate):
    staff_obj = StaffMember(**input.model_dump())
    doc = staff_obj.model_dump()
    await db.staff.insert_one(doc)
    return staff_obj

@api_router.get("/staff", response_model=List[StaffMember])
async def get_staff():
    staff = await db.staff.find({}, {"_id": 0}).to_list(100)
    return staff

@api_router.post("/staff/login")
async def staff_login(pin: str = Query(...)):
    staff = await db.staff.find_one({"pin": pin}, {"_id": 0})
    if not staff:
        raise HTTPException(status_code=401, detail="PIN non valido")
    return staff

@api_router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str):
    result = await db.staff.delete_one({"id": staff_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff non trovato")
    return {"message": "Staff eliminato"}

# ================== TIME TRACKING ENDPOINTS ==================

@api_router.post("/time-entries", response_model=TimeEntry)
async def create_time_entry(input: TimeEntryCreate):
    entry_obj = TimeEntry(**input.model_dump())
    doc = entry_obj.model_dump()
    await db.time_entries.insert_one(doc)
    return entry_obj

@api_router.get("/time-entries", response_model=List[TimeEntry])
async def get_time_entries(staff_id: Optional[str] = None, date: Optional[str] = None):
    query = {}
    if staff_id:
        query["staff_id"] = staff_id
    if date:
        query["timestamp"] = {"$regex": f"^{date}"}
    entries = await db.time_entries.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return entries

@api_router.get("/time-entries/monthly-hours")
async def get_monthly_hours(year: int, month: int):
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{month + 1:02d}-01"
    
    entries = await db.time_entries.find({
        "timestamp": {"$gte": start_date, "$lt": end_date}
    }, {"_id": 0}).sort("timestamp", 1).to_list(10000)
    
    # Calculate hours per staff
    staff_hours = {}
    staff_entries = {}
    
    for entry in entries:
        staff_id = entry["staff_id"]
        if staff_id not in staff_entries:
            staff_entries[staff_id] = {"name": entry["staff_name"], "clock_ins": [], "clock_outs": []}
        
        if entry["entry_type"] == "clock_in":
            staff_entries[staff_id]["clock_ins"].append(entry["timestamp"])
        else:
            staff_entries[staff_id]["clock_outs"].append(entry["timestamp"])
    
    for staff_id, data in staff_entries.items():
        total_minutes = 0
        clock_ins = sorted(data["clock_ins"])
        clock_outs = sorted(data["clock_outs"])
        
        for i, clock_in in enumerate(clock_ins):
            if i < len(clock_outs):
                try:
                    in_time = datetime.fromisoformat(clock_in.replace('Z', '+00:00'))
                    out_time = datetime.fromisoformat(clock_outs[i].replace('Z', '+00:00'))
                    diff = (out_time - in_time).total_seconds() / 60
                    if diff > 0:
                        total_minutes += diff
                except (ValueError, TypeError, KeyError):
                    pass
        
        hours = total_minutes / 60
        staff_hours[staff_id] = {"name": data["name"], "hours": round(hours, 2)}
    
    return staff_hours

@api_router.get("/time-entries/last-entry/{staff_id}")
async def get_last_entry(staff_id: str):
    entry = await db.time_entries.find_one(
        {"staff_id": staff_id}, 
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    return entry

# ================== LOG ENTRIES ENDPOINTS ==================

@api_router.post("/logs", response_model=LogEntry)
async def create_log_entry(input: LogEntryCreate):
    log_obj = LogEntry(**input.model_dump())
    doc = log_obj.model_dump()
    await db.log_entries.insert_one(doc)
    return log_obj

@api_router.get("/logs", response_model=List[LogEntry])
async def get_log_entries(
    category: Optional[str] = None, 
    date: Optional[str] = None,
    resident_id: Optional[str] = None,
    shift: Optional[str] = None
):
    query = {}
    if category:
        query["category"] = category
    if date:
        query["created_at"] = {"$regex": f"^{date}"}
    if resident_id:
        query["resident_id"] = resident_id
    if shift:
        query["shift"] = shift
    logs = await db.log_entries.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return logs

@api_router.delete("/logs/{log_id}")
async def delete_log_entry(log_id: str):
    result = await db.log_entries.delete_one({"id": log_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log non trovato")
    return {"message": "Log eliminato"}

# ================== SHIFT HANDOVER ENDPOINTS ==================

@api_router.post("/handovers", response_model=ShiftHandover)
async def create_handover(input: ShiftHandoverCreate):
    handover_obj = ShiftHandover(**input.model_dump())
    doc = handover_obj.model_dump()
    await db.shift_handovers.insert_one(doc)
    return handover_obj

@api_router.get("/handovers", response_model=List[ShiftHandover])
async def get_handovers(date: Optional[str] = None, pending: bool = False):
    query = {}
    if date:
        query["date"] = date
    if pending:
        query["acknowledged_by"] = None
    handovers = await db.shift_handovers.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return handovers

@api_router.put("/handovers/{handover_id}/acknowledge")
async def acknowledge_handover(handover_id: str, input: ShiftHandoverAcknowledge):
    result = await db.shift_handovers.update_one(
        {"id": handover_id},
        {"$set": {
            "acknowledged_by": input.staff_id,
            "acknowledged_name": input.staff_name,
            "acknowledged_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Consegna non trovata")
    return {"message": "Consegna confermata"}

# ================== MEAL RECORDS ENDPOINTS ==================

@api_router.post("/meals", response_model=MealRecord)
async def create_meal_record(input: MealRecordCreate):
    meal_obj = MealRecord(**input.model_dump())
    doc = meal_obj.model_dump()
    await db.meal_records.insert_one(doc)
    return meal_obj

@api_router.get("/meals", response_model=List[MealRecord])
async def get_meal_records(date: Optional[str] = None, month: Optional[str] = None):
    query = {}
    if date:
        query["date"] = date
    if month:
        query["date"] = {"$regex": f"^{month}"}
    meals = await db.meal_records.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return meals

@api_router.get("/meals/waste-stats")
async def get_waste_stats(month: Optional[str] = None):
    query = {}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    meals = await db.meal_records.find(query, {"_id": 0}).to_list(1000)
    
    stats = {
        "total_meals": len(meals),
        "total_servings": sum(m.get("meal_count", 0) for m in meals),
        "avg_quality": round(sum(m.get("quality_rating", 0) for m in meals) / len(meals), 1) if meals else 0,
        "leftover_breakdown": {"nessuno": 0, "pochi": 0, "molti": 0}
    }
    
    for meal in meals:
        status = meal.get("leftover_status", "nessuno")
        if status in stats["leftover_breakdown"]:
            stats["leftover_breakdown"][status] += 1
    
    return stats

# ================== RESIDENTS ENDPOINTS ==================

@api_router.post("/residents", response_model=Resident)
async def create_resident(input: ResidentCreate):
    resident_obj = Resident(**input.model_dump())
    doc = resident_obj.model_dump()
    await db.residents.insert_one(doc)
    return resident_obj

@api_router.get("/residents", response_model=List[Resident])
async def get_residents(room: Optional[int] = None, status: Optional[str] = None):
    query = {}
    if room:
        query["room_number"] = room
    if status:
        query["status"] = status
    residents = await db.residents.find(query, {"_id": 0}).sort("room_number", 1).to_list(200)
    return residents

@api_router.get("/residents/{resident_id}", response_model=Resident)
async def get_resident(resident_id: str):
    resident = await db.residents.find_one({"id": resident_id}, {"_id": 0})
    if not resident:
        raise HTTPException(status_code=404, detail="Residente non trovato")
    return resident

@api_router.put("/residents/{resident_id}", response_model=Resident)
async def update_resident(resident_id: str, input: ResidentUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nessun dato da aggiornare")
    
    result = await db.residents.update_one({"id": resident_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Residente non trovato")
    
    resident = await db.residents.find_one({"id": resident_id}, {"_id": 0})
    return resident

@api_router.delete("/residents/{resident_id}")
async def delete_resident(resident_id: str):
    result = await db.residents.delete_one({"id": resident_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Residente non trovato")
    return {"message": "Residente eliminato"}

# ================== LAUNDRY SCHEDULE ENDPOINTS ==================

def calculate_laundry_rooms(date_str: str) -> dict:
    """Calculate which rooms should do laundry on a given date based on 3-shift rotation"""
    try:
        date = datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        date = datetime.now(timezone.utc)
    
    # Get day of week (0=Monday, 6=Sunday)
    day_of_week = date.weekday()
    
    # Skip Sunday (6)
    if day_of_week == 6:
        return {"shift_1": [], "shift_2": [], "shift_3": []}
    
    # Week number in month (0-4)
    week_of_month = (date.day - 1) // 7
    
    # Calculate rotation offset based on week
    rotation_offset = week_of_month % 3
    
    # Base room groups for each day (Monday=0 to Saturday=5)
    # With 32 rooms, roughly 5-6 rooms per day over 6 days
    rooms_per_day = 6 if day_of_week < 2 else 5
    start_room = (day_of_week * 6) + 1
    
    if start_room > 32:
        return {"shift_1": [], "shift_2": [], "shift_3": []}
    
    end_room = min(start_room + rooms_per_day - 1, 32)
    day_rooms = list(range(start_room, end_room + 1))
    
    # Distribute rooms across 3 shifts with rotation
    shifts = [[], [], []]
    for i, room in enumerate(day_rooms):
        shift_idx = (i + rotation_offset) % 3
        shifts[shift_idx].append(room)
    
    return {
        "shift_1": shifts[0],
        "shift_2": shifts[1],
        "shift_3": shifts[2]
    }

@api_router.get("/laundry/today")
async def get_today_laundry():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    rooms = calculate_laundry_rooms(today)
    return {"date": today, **rooms}

@api_router.get("/laundry/schedule")
async def get_laundry_schedule(date: Optional[str] = None):
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    rooms = calculate_laundry_rooms(date)
    
    # Check completion status from DB
    schedule_entry = await db.laundry_schedule.find_one({"date": date}, {"_id": 0})
    
    return {
        "date": date,
        **rooms,
        "completed": schedule_entry.get("completed", False) if schedule_entry else False,
        "completed_by": schedule_entry.get("completed_by") if schedule_entry else None
    }

@api_router.post("/laundry/complete")
async def complete_laundry(date: str, shift: int, staff_id: str, staff_name: str):
    await db.laundry_schedule.update_one(
        {"date": date},
        {"$set": {
            f"shift_{shift}_completed": True,
            f"shift_{shift}_completed_by": staff_name,
            f"shift_{shift}_completed_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": f"Turno {shift} completato"}

# ================== EXPORT/IMPORT ENDPOINTS ==================

@api_router.get("/export")
async def export_data():
    data = ExportData(
        staff=await db.staff.find({}, {"_id": 0}).to_list(100),
        residents=await db.residents.find({}, {"_id": 0}).to_list(200),
        time_entries=await db.time_entries.find({}, {"_id": 0}).to_list(10000),
        log_entries=await db.log_entries.find({}, {"_id": 0}).to_list(10000),
        shift_handovers=await db.shift_handovers.find({}, {"_id": 0}).to_list(1000),
        meal_records=await db.meal_records.find({}, {"_id": 0}).to_list(10000),
        laundry_schedule=await db.laundry_schedule.find({}, {"_id": 0}).to_list(1000),
        exported_at=datetime.now(timezone.utc).isoformat()
    )
    return data.model_dump()

@api_router.post("/import")
async def import_data(data: dict):
    try:
        # Clear existing data
        await db.staff.delete_many({})
        await db.residents.delete_many({})
        await db.time_entries.delete_many({})
        await db.log_entries.delete_many({})
        await db.shift_handovers.delete_many({})
        await db.meal_records.delete_many({})
        await db.laundry_schedule.delete_many({})
        
        # Import new data
        if data.get("staff"):
            await db.staff.insert_many(data["staff"])
        if data.get("residents"):
            await db.residents.insert_many(data["residents"])
        if data.get("time_entries"):
            await db.time_entries.insert_many(data["time_entries"])
        if data.get("log_entries"):
            await db.log_entries.insert_many(data["log_entries"])
        if data.get("shift_handovers"):
            await db.shift_handovers.insert_many(data["shift_handovers"])
        if data.get("meal_records"):
            await db.meal_records.insert_many(data["meal_records"])
        if data.get("laundry_schedule"):
            await db.laundry_schedule.insert_many(data["laundry_schedule"])
        
        return {"message": "Dati importati con successo"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Errore importazione: {str(e)}")

# ================== SEED DATA ENDPOINT ==================

@api_router.post("/seed")
async def seed_data():
    # Check if data already exists
    existing_staff = await db.staff.count_documents({})
    if existing_staff > 0:
        return {"message": "Dati già presenti"}
    
    # Seed staff members
    staff_members = [
        {"name": "Maher", "pin": "1111", "role": "operatore"},
        {"name": "Daniele", "pin": "2222", "role": "operatore"},
        {"name": "Costantino", "pin": "3333", "role": "operatore"},
        {"name": "Gaia", "pin": "4444", "role": "coordinatrice"},
        {"name": "Elena", "pin": "5555", "role": "operatore"},
        {"name": "Fabian", "pin": "6666", "role": "operatore"},
        {"name": "Alfredo", "pin": "7777", "role": "operatore"},
        {"name": "Alex", "pin": "8888", "role": "operatore"},
        {"name": "Alla", "pin": "9999", "role": "operatore"},
        {"name": "Nenad", "pin": "0000", "role": "operatore"},
    ]
    
    for staff in staff_members:
        staff_obj = StaffMember(**staff)
        await db.staff.insert_one(staff_obj.model_dump())
    
    # Seed residents from analyzed images
    residents_data = [
        {"surname": "AHMED", "name": "Masood", "nationality": "Pakistan", "room_number": 2},
        {"surname": "GUIRE", "name": "Oumar", "nationality": "Costa D'Avorio", "room_number": 2},
        {"surname": "SIDIBE", "name": "Ismaile", "nationality": "Costa D'Avorio", "room_number": 2},
        {"surname": "BEPARI", "name": "Alamin", "nationality": "Bangladesh", "room_number": 3},
        {"surname": "MATUBBAR", "name": "Ratul", "nationality": "Bangladesh", "room_number": 3},
        {"surname": "MIAH", "name": "Anik", "nationality": "Bangladesh", "room_number": 3},
        {"surname": "NOMAN", "name": "Muhammad", "nationality": "Pakistan", "room_number": 4},
        {"surname": "HASSAN", "name": "Ali", "nationality": "Pakistan", "room_number": 4},
        {"surname": "SORDAR", "name": "MD Shipon", "nationality": "Bangladesh", "room_number": 4},
        {"surname": "ULLAH", "name": "Abd", "nationality": "Pakistan", "room_number": 4},
        {"surname": "SHEIKH", "name": "Alamin", "nationality": "Bangladesh", "room_number": 5},
        {"surname": "ISLAM", "name": "Md Shahidul", "nationality": "Bangladesh", "room_number": 5},
        {"surname": "MATUBBER", "name": "Rabiul", "nationality": "Bangladesh", "room_number": 5},
        {"surname": "MIA", "name": "Md Liton", "nationality": "Bangladesh", "room_number": 5},
        {"surname": "MAREI", "name": "Hasan Antar", "nationality": "Egitto", "room_number": 6},
        {"surname": "MAREI", "name": "Hazen Asil", "nationality": "Egitto", "room_number": 6},
        {"surname": "ABOUHAMED", "name": "Wahid Tarek", "nationality": "Egitto", "room_number": 6},
        {"surname": "ABDERAHMAN ADAM", "name": "Abdiladif", "nationality": "Somalia", "room_number": 7},
        {"surname": "SHINWARI", "name": "Akhtar Mohammad", "nationality": "Afghanistan", "room_number": 7},
    ]
    
    for res in residents_data:
        resident_obj = Resident(**res)
        await db.residents.insert_one(resident_obj.model_dump())
    
    return {"message": "Dati seed inseriti con successo", "staff_count": len(staff_members), "residents_count": len(residents_data)}

# ================== REPORT ENDPOINTS ==================

@api_router.get("/reports/attendance")
async def get_attendance_report(year: int, month: int):
    # Staff attendance
    staff_hours = await get_monthly_hours(year, month)
    
    # Resident presence (simplified)
    residents = await db.residents.find({}, {"_id": 0}).to_list(200)
    
    return {
        "period": f"{year}-{month:02d}",
        "staff_attendance": staff_hours,
        "resident_count": len(residents),
        "residents_by_status": {
            "presente": len([r for r in residents if r.get("status") == "presente"]),
            "assente": len([r for r in residents if r.get("status") == "assente"]),
            "isolamento": len([r for r in residents if r.get("status") == "isolamento"])
        }
    }

@api_router.get("/reports/security")
async def get_security_report(year: int, month: int):
    month_str = f"{year}-{month:02d}"
    logs = await db.log_entries.find({
        "category": "Sicurezza",
        "created_at": {"$regex": f"^{month_str}"}
    }, {"_id": 0}).to_list(1000)
    
    return {
        "period": month_str,
        "total_incidents": len(logs),
        "incidents": logs
    }

@api_router.get("/reports/food-waste")
async def get_food_waste_report(year: int, month: int):
    month_str = f"{year}-{month:02d}"
    stats = await get_waste_stats(month_str)
    meals = await db.meal_records.find({
        "date": {"$regex": f"^{month_str}"}
    }, {"_id": 0}).to_list(1000)
    
    return {
        "period": month_str,
        "statistics": stats,
        "detailed_records": meals
    }

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
