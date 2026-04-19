# AI 记忆模块 API 需求文档

## 问题描述

当前前端在选择"所有范围"（All Scopes）时，无法看到知识图谱中的边（edges/关系线）。只有选择具体某个范围时才能看到边。

## 期望行为

当用户选择"所有范围"时，应该能看到所有范围的边聚合在一起，形成一个包含多个"线团"的知识图谱。

## 后端需要修改的 API 端点

### 1. GET /api/ai/memory/edges

**当前行为**：当不传递 `scope_key` 参数时，返回空结果或错误。

**期望行为**：
- 不传递 `scope_key` 时，返回**所有范围**的边
- 或者返回跨所有 scope 的全局边列表

**请求示例**：
```bash
# 当前（返回空）
curl "http://localhost:8000/api/ai/memory/edges?page=1&page_size=100"

# 期望：返回所有范围的边
curl "http://localhost:8000/api/ai/memory/edges?page=1&page_size=100"
# Response:
{
  "status": 0,
  "msg": "success",
  "data": {
    "items": [
      {
        "id": "edge_001",
        "scope_key": "group:xxx",
        "source_entity_id": "entity_001",
        "target_entity_id": "entity_002",
        "fact": "xxx是yyy的xx",
        ...
      },
      {
        "id": "edge_002", 
        "scope_key": "group:yyy",  # 不同范围的边
        "source_entity_id": "entity_003",
        "target_entity_id": "entity_004",
        ...
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 100
  }
}
```

### 2. GET /api/ai/memory/entities

**当前行为**：当不传递 `scope_key` 参数时，返回空结果或错误。

**期望行为**：不传递 `scope_key` 时，返回所有范围的实体。

### 3. GET /api/ai/memory/episodes

**期望行为**：不传递 `scope_key` 时，返回所有范围的对话片段。

### 4. GET /api/ai/memory/categories

**期望行为**：不传递 `scope_key` 时，返回所有范围的分类。

## 其他相关端点

### GET /api/ai/memory/scopes

此端点已正常工作，返回所有 scope_key 列表。

### GET /api/ai/memory/stats

此端点已正常工作，返回全局统计数据。

## 实现建议

### 方案一：修改现有逻辑
当 `scope_key` 为空/null 时，查询条件变为"不限 scope"，返回所有数据。

```python
# 示例 (假设使用 SQLAlchemy)
def get_edges(scope_key: str = None, page: int = 1, page_size: int = 20):
    query = db.query(Edge)
    
    if scope_key:  # 如果指定了 scope_key，只查该范围
        query = query.filter(Edge.scope_key == scope_key)
    # else: 不加过滤条件，查所有
    
    total = query.count()
    edges = query.offset((page-1)*page_size).limit(page_size).all()
    return {"items": edges, "total": total, "page": page, "page_size": page_size}
```

### 方案二：添加全局端点
添加新的端点如 `/api/ai/memory/edges/all`，专门返回所有范围的边。

## 测试验证

前端测试时，可以通过以下步骤验证：
1. 选择"所有范围"（All Scopes）
2. 确认图谱中显示边（线）
3. 切换到具体范围，确认数据一致

## 联系

如有问题，请联系前端开发者确认 API 响应格式。
