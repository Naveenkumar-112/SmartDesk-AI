from backend.config.database import connect_db

try:
    database = connect_db()

    if database is not None:
        print("Database test successful!")
        print("Database name:", database.name)

except Exception as error:
    print("Database test failed:", error)