from pathlib import Path
import sqlite3
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

p = Path(r"C:\tmp\supportiq_debug.db")
p.unlink(missing_ok=True)
config = Config(r"C:\Users\janardhan-thrishank-Singumahanthi\OneDrive\Desktop\Support iq\backend\alembic.ini")
config.set_main_option("script_location", str(Path(r"C:\Users\janardhan-thrishank-Singumahanthi\OneDrive\Desktop\Support iq\backend\app\db\migrations").resolve()))
config.set_main_option("sqlalchemy.url", f"sqlite:///{p}")
print('URL', config.get_main_option('sqlalchemy.url'))
command.upgrade(config, 'head')
print('exists', p.exists(), 'size', p.stat().st_size if p.exists() else None)
con = sqlite3.connect(str(p))
print(con.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall())
con.close()
engine = create_engine(f"sqlite:///{p}")
print('inspector', inspect(engine).get_table_names())
