mkdir package
python3 -m pip install --target ./package PyMySQL 
cd package
zip -r ../package.zip .
cd ..
zip -g package.zip index.py 