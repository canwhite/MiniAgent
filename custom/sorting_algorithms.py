"""
排序算法实现
包含多种常见的排序算法
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
    left_half = arr[:mid]
    right_half = arr[mid:]
    
    # 递归排序
    left_half = merge_sort(left_half)
    right_half = merge_sort(right_half)
    
    # 合并
    return merge(left_half, right_half)


def merge(left, right):
    """合并两个已排序的数组"""
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    # 添加剩余元素
    result.extend(left[i:])
    result.extend(right[j:])
    
    return result


def quick_sort(arr):
    """
    快速排序
    时间复杂度：O(n log n) 平均，O(n²) 最坏
    空间复杂度：O(log n)
    """
    if len(arr) <= 1:
        return arr
    
    # 选择基准元素
    pivot = arr[len(arr) // 2]
    
    # 分割数组
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    # 递归排序并合并
    return quick_sort(left) + middle + quick_sort(right)


def heap_sort(arr):
    """
    堆排序
    时间复杂度：O(n log n)
    空间复杂度：O(1)
    """
    def heapify(arr, n, i):
        """构建最大堆"""
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
        arr[i], arr[0] = arr[0], arr[i]  # 交换
        heapify(arr, i, 0)
    
    return arr


def counting_sort(arr):
    """
    计数排序（适用于整数且范围较小的情况）
    时间复杂度：O(n + k)，k是数值范围
    空间复杂度：O(k)
    """
    if not arr:
        return arr
    
    # 找到最大值和最小值
    max_val = max(arr)
    min_val = min(arr)
    
    # 创建计数数组
    count_size = max_val - min_val + 1
    count = [0] * count_size
    
    # 计数
    for num in arr:
        count[num - min_val] += 1
    
    # 重建排序后的数组
    sorted_arr = []
    for i in range(count_size):
        sorted_arr.extend([i + min_val] * count[i])
    
    return sorted_arr


def test_sorting_algorithms():
    """测试所有排序算法"""
    test_cases = [
        [64, 34, 25, 12, 22, 11, 90],
        [5, 2, 8, 1, 9],
        [1, 2, 3, 4, 5],  # 已排序
        [5, 4, 3, 2, 1],  # 逆序
        [42],  # 单个元素
        [],  # 空数组
    ]
    
    algorithms = [
        ("冒泡排序", bubble_sort),
        ("选择排序", selection_sort),
        ("插入排序", insertion_sort),
        ("归并排序", merge_sort),
        ("快速排序", quick_sort),
        ("堆排序", heap_sort),
        ("计数排序", counting_sort),
    ]
    
    for i, test_arr in enumerate(test_cases):
        print(f"\n测试用例 {i+1}: {test_arr}")
        original = test_arr.copy()
        
        for name, func in algorithms:
            # 计数排序只适用于整数
            if name == "计数排序" and test_arr and not all(isinstance(x, int) for x in test_arr):
                continue
                
            arr_copy = test_arr.copy()
            try:
                sorted_arr = func(arr_copy)
                print(f"  {name}: {sorted_arr}")
            except Exception as e:
                print(f"  {name}: 错误 - {e}")


if __name__ == "__main__":
    print("排序算法测试")
    print("=" * 50)
    test_sorting_algorithms()
    
    # 性能比较示例
    print("\n" + "=" * 50)
    print("性能比较示例（随机数组）:")
    
    import random
    import time
    
    random_arr = [random.randint(1, 1000) for _ in range(100)]
    
    algorithms = [
        ("冒泡排序", bubble_sort),
        ("选择排序", selection_sort),
        ("插入排序", insertion_sort),
        ("归并排序", merge_sort),
        ("快速排序", quick_sort),
        ("堆排序", heap_sort),
    ]
    
    for name, func in algorithms:
        arr_copy = random_arr.copy()
        start_time = time.time()
        func(arr_copy)
        end_time = time.time()
        print(f"  {name}: {end_time - start_time:.6f} 秒")