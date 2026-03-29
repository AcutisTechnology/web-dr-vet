# Datasets Apify - Medicamentos VetSmart

Os jobs de scraping coletaram **227 produtos** com bulário completo antes do limite de créditos.
Os dados estão nos datasets Apify abaixo e podem ser baixados diretamente:

## Links de Download

### Dataset 1 - Job Auto-descoberta (141 produtos - mix CG+BE)
```
https://api.apify.com/v2/datasets/YDCAupx8wgiy2UU2Y/items?format=json
```
Download CSV:
```
https://api.apify.com/v2/datasets/YDCAupx8wgiy2UU2Y/items?format=csv
```

### Dataset 2 - Job Paginação Completa (86 produtos - principalmente pequenos animais)
```
https://api.apify.com/v2/datasets/6f5UN60stW3c5zsmw/items?format=json
```

## Estrutura dos Dados

Cada produto contém:
- `url`, `tipo` (pequenos/grandes), `nome`, `empresa`, `linhaComercial`
- `classificacao`, `especies`, `descricao`
- `principiosAtivos` (array)
- `sections` com chaves: "Sobre", "Apresentações e concentrações", "Indicações e contraindicações", "Administração e doses", "Interações medicamentosas", "Farmacologia"
- `interacoes` (array estruturado com tipo/grau/efeito/conduta)
- `dosagens` (array com espécie/dose/subgrupo)

## Converter para JSON Separados

Para separar em pequenos/grandes animais, filtre pelo campo `tipo`:
- `"tipo": "pequenos"` → medicamentos para cães e gatos
- `"tipo": "grandes"` → medicamentos para bovinos e equinos

## Código Python para Processar

```python
import json, urllib.request

def baixar_dataset(dataset_id):
    url = f"https://api.apify.com/v2/datasets/{dataset_id}/items?format=json&limit=1000"
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read())

d1 = baixar_dataset('YDCAupx8wgiy2UU2Y')
d2 = baixar_dataset('6f5UN60stW3c5zsmw')

todos = {i['url']: i for i in d1 + d2}  # deduplicar por URL

pequenos = [v for v in todos.values() if v.get('tipo') == 'pequenos' or '/cg/' in v.get('url','')]
grandes = [v for v in todos.values() if v.get('tipo') == 'grandes' or '/be/' in v.get('url','')]

with open('medicamentos_pequenos_animais.json', 'w', encoding='utf-8') as f:
    json.dump({"total": len(pequenos), "medicamentos": pequenos}, f, ensure_ascii=False, indent=2)

with open('medicamentos_grandes_animais.json', 'w', encoding='utf-8') as f:
    json.dump({"total": len(grandes), "medicamentos": grandes}, f, ensure_ascii=False, indent=2)

print(f"Pequenos: {len(pequenos)} | Grandes: {len(grandes)}")
```

## Observação

Os datasets Apify ficam disponíveis por **7 dias** após a criação.
Faça o download o quanto antes para não perder os dados.
