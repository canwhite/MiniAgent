# 排序算法总结

## 1. 快速排序（Quick Sort）

快速排序是一种分治算法，平均时间复杂度为 O(n log n)。

```python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)

# 测试
arr = [64, 34, 25, 12, 22, 11, 90]
print("快速排序:", quick_sort(arr.copy()))
```

## 2. 归并排序（Merge Sort）

归并排序是稳定的排序算法，时间复杂度为 O(n log n)。

```python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

# 测试
arr = [64, 34, 25, 12, 22, 11, 90]
print("归并排序:", merge_sort(arr.copy()))
```

## 3. 堆排序（Heap Sort）

堆排序是一种原地排序算法，时间复杂度为 O(n log n)。

```python
def heap_sort(arr):
    def heapify(arr, n, i):
        largest = i
        left = 2 * i + 1
        right = 2 * i + 2
        
        if left < n and arr[left] > arr[largest]:
            largest = left
        if right < n and arr[right] > arr[largest]:
            largest = right
        if largest != i:
            arr[i], arr[largest] = arr[largest], arr[i]
            heapify(arr, n, largest)
    
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        heapify(arr, i, 0)
    
    return arr

# 测试
arr = [64, 34, 25, 12, 22, 11, 90]
print("堆排序:", heap_sort(arr.copy()))
```

## 算法对比

| 算法 | 时间复杂度 | 空间复杂度 | 稳定性 |
|------|-----------|-----------|--------|
| 快速排序 | O(n log n) | O(log n) | ❌ 不稳定 |
| 归并排序 | O(n log n) | O(n) | ✅ 稳定 |
| 堆排序 | O(n log n) | O(1) | ❌ 不稳定 |
| 冒泡排序 | O(n²) | O(1) | ✅ 稳定 |

## 使用建议

- **一般情况**：快速排序（平均性能最好）
- **需要稳定排序**：归并排序
- **内存受限**：堆排序
