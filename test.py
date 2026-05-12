import requests
import traceback
try:
  r = requests.get('https://beyblade.phstudy.org/data/main.json', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'})
  print(r.status_code)
  print(r.text[:200])
except Exception as e:
  traceback.print_exc()
