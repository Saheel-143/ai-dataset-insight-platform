"""
Sample Datasets Generator for AI Dataset Insight Platform
Generates 5 realistic datasets:
1. sales_data.csv (Retail Sales & Profitability)
2. student_performance.xlsx (Academic Performance & Attendance)
3. video_game_sales.csv (Global Gaming Sales by Platform & Genre)
4. healthcare_patients.csv (Patient Vitals, Conditions & Treatment Costs)
5. customer_churn.csv (Banking Customer Churn & Financial Metrics)
"""
import os
import random
import numpy as np
import pandas as pd

def generate_all_samples(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    np.random.seed(42)
    random.seed(42)

    # 1. Sales Dataset (CSV)
    print("Generating Sales Dataset...")
    n_sales = 500
    regions = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"]
    categories = ["Electronics", "Office Supplies", "Furniture", "Apparel", "Hardware"]
    products_map = {
        "Electronics": ["Pro Laptop 15", "Wireless Headphones", "Ultra HD Monitor", "Smart Watch 5", "USB-C Hub"],
        "Office Supplies": ["Ergonomic Chair", "Standing Desk", "Filing Cabinet", "Gel Pen Set", "Laser Paper Ream"],
        "Furniture": ["Executive Desk", "Bookshelf Modern", "Mesh Task Chair", "Conference Table", "Lounge Sofa"],
        "Apparel": ["Branded Hoodie", "Polo T-Shirt", "Corporate Jacket", "Performance Cap", "Backpack Pro"],
        "Hardware": ["Mechanical Keyboard", "Precision Mouse", "Webcam 4K", "Surge Protector", "Cable Management Kit"]
    }
    channels = ["Online Store", "Direct Sales", "Wholesale Partner", "Retail Affiliate"]

    sales_data = []
    base_date = pd.Timestamp("2024-01-01")

    for i in range(n_sales):
        region = random.choice(regions)
        category = random.choice(categories)
        product = random.choice(products_map[category])
        channel = random.choice(channels)
        units = int(np.random.choice([1, 2, 3, 4, 5, 10, 15, 20, 50], p=[0.25, 0.25, 0.15, 0.1, 0.1, 0.07, 0.04, 0.03, 0.01]))
        unit_price = round(float(np.random.uniform(25.0, 850.0)), 2)
        discount = round(float(np.random.choice([0.0, 0.05, 0.10, 0.15, 0.20], p=[0.4, 0.25, 0.2, 0.1, 0.05])), 2)
        revenue = round(units * unit_price * (1.0 - discount), 2)
        cost_ratio = float(np.random.uniform(0.45, 0.75))
        cost = round(revenue * cost_ratio, 2)
        profit = round(revenue - cost, 2)
        profit_margin = round((profit / revenue * 100), 2) if revenue > 0 else 0
        date = base_date + pd.Timedelta(days=int(np.random.randint(0, 365)))
        customer_rating = round(float(np.random.choice([3.0, 3.5, 4.0, 4.5, 5.0], p=[0.05, 0.15, 0.35, 0.3, 0.15])), 1)

        sales_data.append({
            "Transaction_ID": f"TRX-{1000 + i}",
            "Date": date.strftime("%Y-%m-%d"),
            "Region": region,
            "Category": category,
            "Product": product,
            "Sales_Channel": channel,
            "Units_Sold": units,
            "Unit_Price": unit_price,
            "Discount": discount,
            "Revenue": revenue,
            "Cost": cost,
            "Profit": profit,
            "Profit_Margin_Pct": profit_margin,
            "Customer_Rating": customer_rating
        })

    df_sales = pd.DataFrame(sales_data)
    # Inject a few missing values and 2 duplicate rows for testing data cleaning
    df_sales.loc[12, "Discount"] = np.nan
    df_sales.loc[45, "Customer_Rating"] = np.nan
    df_sales.loc[88, "Profit_Margin_Pct"] = np.nan
    df_sales.loc[120, "Sales_Channel"] = np.nan
    # Add 2 duplicate rows
    df_sales = pd.concat([df_sales, df_sales.iloc[[5, 10]]], ignore_index=True)
    sales_path = os.path.join(output_dir, "sales_data.csv")
    df_sales.to_csv(sales_path, index=False)
    print(f"Saved: {sales_path} ({len(df_sales)} rows, {len(df_sales.columns)} cols)")

    # 2. Student Performance Dataset (Excel .xlsx)
    print("Generating Student Performance Dataset...")
    n_students = 350
    majors = ["Computer Science", "Data Science", "Business Analytics", "Mechanical Eng", "Finance", "Biology"]
    study_habits = ["Regular", "Last Minute", "Group Study", "Independent", "Blended"]

    students_data = []
    for i in range(n_students):
        study_hours = round(float(np.random.normal(18, 6)), 1)
        study_hours = max(2.0, min(40.0, study_hours))
        attendance = round(float(np.random.normal(84, 10)), 1)
        attendance = max(45.0, min(100.0, attendance))

        base_score = 40 + (study_hours * 1.1) + (attendance * 0.35)
        math_score = int(np.clip(np.random.normal(base_score, 7), 25, 100))
        reading_score = int(np.clip(np.random.normal(base_score + 3, 6), 30, 100))
        science_score = int(np.clip(np.random.normal(base_score - 2, 8), 20, 100))
        overall_gpa = round((math_score + reading_score + science_score) / 30.0, 2)
        passed = "Yes" if overall_gpa >= 6.0 else "No"
        scholarship = "Yes" if overall_gpa >= 9.0 else "No"

        students_data.append({
            "Student_ID": f"STU-{202400 + i}",
            "Gender": random.choice(["Male", "Female", "Non-Binary"]),
            "Major": random.choice(majors),
            "Study_Habits": random.choice(study_habits),
            "Weekly_Study_Hours": study_hours,
            "Attendance_Rate_Pct": attendance,
            "Math_Score": math_score,
            "Reading_Score": reading_score,
            "Science_Score": science_score,
            "Overall_GPA": overall_gpa,
            "Scholarship": scholarship,
            "Passed": passed
        })

    df_students = pd.DataFrame(students_data)
    df_students.loc[15, "Weekly_Study_Hours"] = np.nan
    df_students.loc[32, "Science_Score"] = np.nan
    # Add 1 duplicate row
    df_students = pd.concat([df_students, df_students.iloc[[3]]], ignore_index=True)
    students_path = os.path.join(output_dir, "student_performance.xlsx")
    df_students.to_excel(students_path, index=False, engine="openpyxl")
    print(f"Saved: {students_path} ({len(df_students)} rows, {len(df_students.columns)} cols)")

    # 3. Video Game Sales Dataset (CSV)
    print("Generating Video Game Sales Dataset...")
    n_games = 450
    platforms = ["PS5", "Xbox Series X", "Nintendo Switch", "PC", "PS4", "Xbox One"]
    genres = ["Action", "Role-Playing", "Sports", "Shooter", "Adventure", "Strategy", "Puzzle", "Racing"]
    publishers = ["Sony Interactive", "Nintendo", "Electronic Arts", "Ubisoft", "Activision Blizzard", "Square Enix", "Capcom", "Indie Studios"]

    game_titles = [
        "Chronicles of Destiny", "Cyber Frontier 2088", "Galactic Odyssey", "Apex Velocity", "Shadow Blade",
        "Kingdom of Legends", "Starship Commander", "Mythic Realm", "Urban Racer Turbo", "Pixel Dungeon Heroes",
        "Bio Hazard Zero", "Tactical Ops Elite", "Dragon Slayer V", "Solaris Awakening", "Street Brawler Champion"
    ]

    games_data = []
    for i in range(n_games):
        platform = random.choice(platforms)
        genre = random.choice(genres)
        publisher = random.choice(publishers)
        year = int(np.random.choice([2019, 2020, 2021, 2022, 2023, 2024], p=[0.1, 0.15, 0.2, 0.25, 0.2, 0.1]))
        critic_score = int(np.clip(np.random.normal(76, 12), 40, 99))
        user_score = round(float(np.clip(critic_score / 10.0 + np.random.normal(0, 0.8), 2.5, 9.8)), 1)
        na_sales = round(float(np.random.exponential(1.5)), 2)
        eu_sales = round(float(np.random.exponential(1.1)), 2)
        jp_sales = round(float(np.random.exponential(0.6)), 2)
        other_sales = round(float(np.random.exponential(0.4)), 2)
        global_sales = round(na_sales + eu_sales + jp_sales + other_sales, 2)
        title = f"{random.choice(game_titles)} {random.choice(['Reloaded', 'Part II', 'Origins', 'Remastered', 'Evolution', ''])}".strip()

        games_data.append({
            "Game_ID": f"GM-{5000 + i}",
            "Title": title,
            "Platform": platform,
            "Year_Released": year,
            "Genre": genre,
            "Publisher": publisher,
            "Critic_Score": critic_score,
            "User_Score": user_score,
            "NA_Sales_M": na_sales,
            "EU_Sales_M": eu_sales,
            "JP_Sales_M": jp_sales,
            "Other_Sales_M": other_sales,
            "Global_Sales_M": global_sales
        })

    df_games = pd.DataFrame(games_data)
    df_games.loc[20, "Critic_Score"] = np.nan
    df_games.loc[55, "User_Score"] = np.nan
    games_path = os.path.join(output_dir, "video_game_sales.csv")
    df_games.to_csv(games_path, index=False)
    print(f"Saved: {games_path} ({len(df_games)} rows, {len(df_games.columns)} cols)")

    # 4. Healthcare Patients Dataset (CSV)
    print("Generating Healthcare Patients Dataset...")
    n_patients = 400
    diagnoses = ["Hypertension", "Type 2 Diabetes", "Asthma", "Cardiovascular Disease", "Osteoarthritis", "Healthy / Routine"]
    departments = ["Cardiology", "Endocrinology", "Pulmonology", "Rheumatology", "General Medicine"]

    patients_data = []
    for i in range(n_patients):
        age = int(np.random.randint(18, 85))
        systolic_bp = int(np.random.normal(125 + (age * 0.2), 15))
        cholesterol = int(np.random.normal(190 + (age * 0.3), 35))
        glucose = int(np.random.normal(105, 25))
        bmi = round(float(np.random.normal(27.0, 5.0)), 1)
        smoker = random.choice(["Never", "Former", "Current"])
        diagnosis = random.choice(diagnoses)
        admission_type = random.choice(["Emergency", "Elective", "Urgent", "Follow-up"])
        days_in_hospital = int(np.random.choice([1, 2, 3, 4, 5, 7, 10, 14], p=[0.3, 0.25, 0.15, 0.1, 0.08, 0.06, 0.04, 0.02]))
        base_cost = 800 + (days_in_hospital * 1200) + (1500 if diagnosis != "Healthy / Routine" else 200)
        treatment_cost = round(float(base_cost + np.random.uniform(-300, 1200)), 2)

        patients_data.append({
            "Patient_ID": f"PAT-{8000 + i}",
            "Age": age,
            "Gender": random.choice(["Male", "Female"]),
            "Blood_Pressure_Systolic": systolic_bp,
            "Cholesterol_mg_dL": cholesterol,
            "Fasting_Glucose_mg_dL": glucose,
            "BMI": bmi,
            "Smoker_Status": smoker,
            "Primary_Diagnosis": diagnosis,
            "Department": random.choice(departments),
            "Admission_Type": admission_type,
            "Length_Of_Stay_Days": days_in_hospital,
            "Total_Treatment_Cost": treatment_cost
        })

    df_patients = pd.DataFrame(patients_data)
    df_patients.loc[8, "BMI"] = np.nan
    df_patients.loc[25, "Cholesterol_mg_dL"] = np.nan
    patients_path = os.path.join(output_dir, "healthcare_patients.csv")
    df_patients.to_csv(patients_path, index=False)
    print(f"Saved: {patients_path} ({len(df_patients)} rows, {len(df_patients.columns)} cols)")

    # 5. Customer Churn Dataset (CSV)
    print("Generating Customer Churn Dataset...")
    n_churn = 480
    countries = ["Germany", "France", "Spain", "United Kingdom", "Italy"]

    churn_data = []
    for i in range(n_churn):
        age = int(np.random.normal(40, 11))
        age = max(19, min(75, age))
        tenure = int(np.random.randint(0, 11))
        credit_score = int(np.clip(np.random.normal(650, 95), 350, 850))
        balance = round(float(np.random.choice([0.0, np.random.uniform(15000, 180000)], p=[0.25, 0.75])), 2)
        num_products = int(np.random.choice([1, 2, 3, 4], p=[0.5, 0.42, 0.06, 0.02]))
        has_card = int(np.random.choice([1, 0], p=[0.7, 0.3]))
        is_active = int(np.random.choice([1, 0], p=[0.52, 0.48]))
        estimated_salary = round(float(np.random.uniform(25000, 195000)), 2)

        # Churn probability higher if inactive, high age, or low credit score
        churn_risk = 0.15 + (0.20 if is_active == 0 else 0.0) + (0.15 if age > 50 else 0.0) + (0.15 if num_products > 2 else 0.0)
        churned = "Yes" if np.random.rand() < churn_risk else "No"

        churn_data.append({
            "Customer_ID": f"CUST-{90000 + i}",
            "Geography": random.choice(countries),
            "Gender": random.choice(["Male", "Female"]),
            "Age": age,
            "Tenure_Years": tenure,
            "Credit_Score": credit_score,
            "Account_Balance": balance,
            "Num_Of_Products": num_products,
            "Has_Credit_Card": has_card,
            "Is_Active_Member": is_active,
            "Estimated_Annual_Salary": estimated_salary,
            "Churn_Status": churned
        })

    df_churn = pd.DataFrame(churn_data)
    df_churn.loc[14, "Account_Balance"] = np.nan
    df_churn.loc[42, "Credit_Score"] = np.nan
    churn_path = os.path.join(output_dir, "customer_churn.csv")
    df_churn.to_csv(churn_path, index=False)
    print(f"Saved: {churn_path} ({len(df_churn)} rows, {len(df_churn.columns)} cols)")
    print("All 5 sample datasets generated successfully!")

if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Sahee\.gemini\antigravity\scratch\ai-dataset-insight-platform\backend\sample_data"
    generate_all_samples(out)

