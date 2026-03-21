#!/usr/bin/env python3
"""
排序算法实现
包含多种常见排序算法的Python实现
"""

def bubble_sort(arr):
    """
    冒泡排序
    时间复杂度：O(n²)
    空间复杂度：O(1)
    """
    n = len(arr)
    for i in range(n):
        # 标记是否发生交换
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                # 交换元素
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        # 如果没有发生交换，说明已经排序完成
        if not swapped:
            break
    return arr


def selection_sort(arr):
    """
    选择排序
    时间复杂度：O(n²)
    空间复杂度：O(1)
    """
    n = len(arr)
    for i in range(n):
        # 找到最小元素的索引
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        # 将最小元素交换到当前位置
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr


def insertion_sort(arr):
    """
    插入排序
    时间复杂度：O(n²)
    空间复杂度：O(1)
    """
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        # 将比key大的元素向右移动
        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr


def quick_sort(arr):
    """
    快速排序
    时间复杂度：平均O(n log n)，最坏O(n²)
    空间复杂度：O(log n)
    """
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)


def merge_sort(arr):
    """
    归并排序
    时间复杂度：O(n log n)
    空间复杂度：O(n)
    """
    if len(arr) <= 1:
        return arr
    
    # 分割数组
    mid = len(arr) // 2
    left = arr[:mid]
    right = arr[mid:]
    
    # 递归排序
    left = merge_sort(left)
    right = merge_sort(right)
    
    # 合并
    return merge(left, right)


def merge(left, right):
    """
    合并两个已排序的数组
    """
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] < right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    # 添加剩余元素
    result.extend(left[i:])
    result.extend(right[j:])
    
    return result


def heap_sort(arr):
    """
    堆排序
    时间复杂度：O(n log n)
    空间复杂度：O(1)
    """
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
    
    # 构建最大堆
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    
    # 逐个提取元素
    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]
        heapify(arr, i, 0)
    
    return arr


def test_sorting_algorithms():
    """测试所有排序算法"""
    test_cases = [
        [64, 34, 25, 12, 22, 11, 90],
        [5, 2, 8, 1, 9],
        [1, 2, 3, 4, 5],  # 已排序
        [5, 4, 3, 2, 1],  # 逆序
        [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5],  # 有重复元素
        [42],  # 单个元素
        [],  # 空数组
    ]
    
    algorithms = {
        "冒泡排序": bubble_sort,
        "选择排序": selection_sort,
        "插入排序": insertion_sort,
        "快速排序": quick_sort,
        "归并排序": merge_sort,
        "堆排序": heap_sort,
    }
    
    for test_name, arr in enumerate(test_cases, 1):
        print(f"\n测试用例 {test_name}: {arr}")
        for algo_name, algo_func in algorithms.items():
            # 创建数组的副本，避免原地排序影响其他算法
            arr_copy = arr.copy()
            sorted_arr = algo_func(arr_copy)
            print(f"  {algo_name}: {sorted_arr}")


def benchmark_sorting_algorithms():
    """性能基准测试"""
    import random
    import time
    
    # 生成测试数据
    sizes = [100, 500, 1000, 5000]
    algorithms = {
        "冒泡排序": bubble_sort,
        "选择排序": selection_sort,
        "插入排序": insertion_sort,
        "快速排序": quick_sort,
        "归并排序": merge_sort,
        "堆排序": heap_sort,
    }
    
    print("排序算法性能基准测试")
    print("=" * 60)
    
    for size in sizes:
        print(f"\n数组大小: {size}")
        arr = [random.randint(1, 10000) for _ in range(size)]
        
        for algo_name, algo_func in algorithms.items():
            # 跳过大数组的O(n²)算法，避免等待时间过长
            if size >= 1000 and algo_name in ["冒泡排序", "选择排序", "插入排序"]:
                print(f"  {algo_name}: 跳过（数组过大）")
                continue
                
            arr_copy = arr.copy()
            start_time = time.time()
            algo_func(arr_copy)
            end_time = time.time()
            elapsed = end_time - start_time
            
            # 验证排序结果
            is_sorted = all(arr_copy[i] <= arr_copy[i + 1] for i in range(len(arr_copy) - 1))
            status = "✓" if is_sorted else "✗"
            
            print(f"  {algo_name}: {elapsed:.6f} 秒 {status}")


if __name__ == "__main__":
    print("排序算法实现")
    print("=" * 60)
    
    # 测试所有算法
    print("\n1. 算法测试:")
    test_sorting_algorithms()
    
    # 性能基准测试（小规模）
    print("\n2. 性能基准测试（小规模）:")
    benchmark_sorting_algorithms()
    
    print("\n3. 使用示例:")
    example_arr = [64, 34, 25, 12, 22, 11, 90]
    print(f"   原始数组: {example_arr}")
    print(f"   快速排序: {quick_sort(example_arr.copy())}")
    print(f"   归并排序: {merge_sort(example_arr.copy())}")
    print(f"   堆排序: {heap_sort(example_arr.copy())}")