"""
- simple lambda function
- double check the lambda handler name 
"""

import datetime
import names
import random
import json
import boto3
import pymysql

#
SECRET_ARN = (
    "arn:aws:secretsmanager:ap-southeast-1:392194582387:secret:mysql-secret-name-W4OOBX"
)

# region
REGION = "ap-southeast-1"

# get credenetials
secrete_client = boto3.client("secretsmanager", region_name=REGION)

# get secret string
secret = secrete_client.get_secret_value(SecretId=SECRET_ARN)

# parse db information
secret_dic = json.loads(secret["SecretString"])
print(secret_dic)

# override
host = secret_dic["host"]
user = secret_dic["username"]
password = secret_dic["password"]
port = secret_dic["port"]


# connect
conn = pymysql.connect(
    host=host,
    user=user,
    password=password,
    port=port,
)

print("CONNECTED")


def create_database(database: str):
    """ """
    cusor = conn.cursor()
    cusor.execute("SHOW DATABASES")
    dbs = cusor.fetchall()
    # list of dbs
    dbs_list = [db[0] for db in dbs]
    # create IcaDb if not existed yet
    if database in dbs_list:
        pass
    else:
        cusor.execute("CREATE DATABASE IcaDb")


def create_table(database: str):
    """
    create a table inside a database
    """
    conn = pymysql.connect(
        host=host, user=user, passwd=password, port=port, database=database
    )
    # cursor
    cur = conn.cursor()
    # drop table if exists
    drop = "DROP TABLE IF EXISTS employees"
    cur.execute(drop)
    # create table
    employee_table = (
        "CREATE TABLE employees ("
        "    id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT, "
        "    name VARCHAR(30) DEFAULT '' NOT NULL, "
        "    age TEXT, "
        "    time TEXT, "
        "PRIMARY KEY (id))"
    )
    cur.execute(employee_table)
    # time stamp
    now = datetime.datetime.now()
    time_stamp = now.strftime("%Y/%m/%d-%H:%M:%S.%f")
    # employees (id, name, age, time)
    employees = [
        (k, names.get_full_name(), random.randint(20, 100), time_stamp)
        for k in range(1, 100)
    ]
    # tuple
    employees = tuple(employees)
    stmt_insert = "INSERT INTO employees (id, name, age, time) VALUES (%s, %s, %s, %s)"
    cur.executemany(stmt_insert, employees)
    conn.commit()
    # show table
    cur.execute("SHOW TABLES")
    tables = cur.fetchall()
    for table in tables:
        print(f"table: {table}")


def fetch_data(database: str):
    """
    query data
    """
    conn = pymysql.connect(
        host=host, user=user, passwd=password, port=port, database=database
    )
    # cursor
    cur = conn.cursor()
    # fetch
    cur.execute("SELECT * FROM employees;")
    # data
    employees = cur.fetchall()
    # print
    for employee in employees:
        print(employee)
    # close
    cur.close()
    conn.close()
    # return
    return employees


# test
if __name__ == "__main__":
    # print("Hello")
    # create_database(database="IcaDb")
    # create_table(database="IcaDb")
    fetch_data(database="IcaDb")
    # pass
