# app.py
from fastapi import FastAPI


# Initialize the **FastAPI application instance**
# app = FastAPI()
app = FastAPI(title="${{ values.project_name }}")

@app.get('/helth')
def check_helth():
    return {'Health':'Healthly'}

@app.get("/")
def read_root():
    return {"Hello": "World"}

# Run with: fastapi dev app.py
