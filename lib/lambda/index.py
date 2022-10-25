"""
- simple lambda function
- double check the lambda handler name 
"""
import os
import datetime
import json
import boto3
import pymysql

# get secret arn from lambda env variable
SECRET_ARN = os.environ["SECRET_ARN"]
# region
REGION = "ap-southeast-1"

# databse credentials => secret manager
# host = "database-3.c3x7jlemonqv.ap-southeast-1.rds.amazonaws.com"
# user = "admin"
# password = "Mike865525"
# port = 3306
dbName = "IcaDb"

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

# secret manager
SECRET_ARN = (
    "arn:aws:secretsmanager:ap-southeast-1:$ACCOUNT_ID:secret:mysql-secret-name-16JD6g"
)


# connect
conn = pymysql.connect(
    host=host, user=user, password=password, port=port, database=dbName
)


def fetch_data():
    """
    query data
    """
    # cursor
    cur = conn.cursor()
    # fetch
    cur.execute("SELECT * FROM employees;")
    # data
    employees = cur.fetchall()
    # print
    for employee in employees:
        print(employee)
    # return
    return employees


def handler(event, context) -> json:
    """
    simple lambda function
    """
    # fetch data from db
    res = fetch_data()
    # return
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,GET",
        },
        "body": json.dumps(res),
    }


# test
if __name__ == "__main__":
    # fetch_data()
    print(handler(event=None, context=None))
