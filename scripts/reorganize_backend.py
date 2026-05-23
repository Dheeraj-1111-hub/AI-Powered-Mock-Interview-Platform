import os
import shutil

# Rename middlewares to middleware
if os.path.exists("backend/src/middlewares"):
    shutil.move("backend/src/middlewares", "backend/src/middleware")
    print("Renamed middlewares to middleware")

# Rename routes to *.routes.ts
routes_dir = "backend/src/routes"
if os.path.exists(routes_dir):
    for file in os.listdir(routes_dir):
        if file.endswith(".ts") and not file.endswith(".routes.ts"):
            src = os.path.join(routes_dir, file)
            dst = os.path.join(routes_dir, file.replace(".ts", ".routes.ts"))
            shutil.move(src, dst)
            print(f"Renamed {src} to {dst}")

# Move config related code to backend/src/config
# (I'll do this manually for db and auth config)
