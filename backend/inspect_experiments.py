import sqlite3

def main():
    conn = sqlite3.connect("backend/supportiq.db")
    cursor = conn.cursor()

    print("=== EXISTING EXPERIMENTS ===")
    for row in cursor.execute("SELECT id, name, status, created_at FROM experiments").fetchall():
        print(f"Exp ID {row[0]}: {row[1]} | status={row[2]} | created={row[3]}")

    print("\n=== EXISTING EXPERIMENT RUNS ===")
    for row in cursor.execute("SELECT id, experiment_id, status, created_at FROM experiment_runs").fetchall():
        print(f"Run ID {row[0]} (Exp {row[1]}): status={row[2]} | created={row[3]}")

    print("\n=== EXISTING EVALUATION RESULTS COUNT ===")
    count = cursor.execute("SELECT count(*) FROM evaluation_results").fetchone()[0]
    print(f"Total evaluation_results rows: {count}")

    conn.close()

if __name__ == "__main__":
    main()
