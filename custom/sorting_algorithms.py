"""
Python排序算法实现
包含多种常见的排序算法
"""

def bubble_sort(arr):
    """
    冒泡排序
    时间复杂度: O(n²)
    空间复杂度: O(1)
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
    时间复杂度: O(n²)
    空间复杂度: O(1)
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
    时间复杂度: O(n²)
    空间复杂度: O(1)
    """
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        # 将大于key的元素向后移动
        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr


def merge_sort(arr):
    """
    归并排序
    时间复杂度: O(n log n)
    空间复杂度: O(n)
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
    时间复杂度: O(n log n) 平均, O(n²) 最坏
    空间复杂度: O(log n)
    """
    if len(arr) <= 1:
        return arr
    
    # 选择基准元素
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    # 递归排序左右部分
    return quick_sort(left) + middle + quick_sort(right)


def heap_sort(arr):
    """
    堆排序
    时间复杂度: O(n log n)
    空间复杂度: O(1)
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


def counting_sort(arr):
    """
    计数排序（适用于整数）
    时间复杂度: O(n + k)
    空间复杂度: O(k)
    """
    if not arr:
        return arr
    
    # 找到最大值和最小值
    max_val = max(arr)
    min_val = min(arr)
    
    # 创建计数数组
    count_size = max_val - min_val + 1
    count = [0] * count_size
    
    # 计数每个元素出现的次数
    for num in arr:
        count[num - min_val] += 1
    
    # 重建排序后的数组
    sorted_arr = []
    for i in range(count_size):
        sorted_arr.extend([i + min_val] * count[i])
    
    return sorted_arr


def radix_sort(arr):
    """
    基数排序（适用于非负整数）
    时间复杂度: O(d * (n + k))
    空间复杂度: O(n + k)
    """
    if not arr:
        return arr
    
    # 找到最大数确定位数
    max_num = max(arr)
    exp = 1
    
    while max_num // exp > 0:
        # 使用计数排序对每个位进行排序
        output = [0] * len(arr)
        count = [0] * 10
        
        # 计数每个数字出现的次数
        for num in arr:
            index = (num // exp) % 10
            count[index] += 1
        
        # 计算累积计数
        for i in range(1, 10):
            count[i] += count[i - 1]
        
        # 构建输出数组
        for i in range(len(arr) - 1, -1, -1):
            index = (arr[i] // exp) % 10
            output[count[index] - 1] = arr[i]
            count[index] -= 1
        
        # 复制回原数组
        for i in range(len(arr)):
            arr[i] = output[i]
        
        exp *= 10
    
    return arr


def shell_sort(arr):
    """
    希尔排序
    时间复杂度: O(n log² n) 到 O(n²)
    空间复杂度: O(1)
    """
    n = len(arr)
    gap = n // 2
    
    while gap > 0:
        for i in range(gap, n):
            temp = arr[i]
            j = i
            while j >= gap and arr[j - gap] > temp:
                arr[j] = arr[j - gap]
                j -= gap
            arr[j] = temp
        gap //= 2
    
    return arr


def bucket_sort(arr):
    """
    桶排序
    时间复杂度: O(n + k) 平均
    空间复杂度: O(n + k)
    """
    if not arr:
        return arr
    
    # 确定桶的数量
    n = len(arr)
    max_val = max(arr)
    min_val = min(arr)
    
    # 创建桶
    bucket_count = min(n, 10)  # 使用10个桶或更少
    buckets = [[] for _ in range(bucket_count)]
    
    # 将元素分配到桶中
    for num in arr:
        index = min(bucket_count - 1, int((num - min_val) * bucket_count / (max_val - min_val + 1)))
        buckets[index].append(num)
    
    # 对每个桶进行排序并合并
    sorted_arr = []
    for bucket in buckets:
        sorted_arr.extend(sorted(bucket))
    
    return sorted_arr


# 测试函数
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
        ("基数排序", radix_sort),
        ("希尔排序", shell_sort),
        ("桶排序", bucket_sort),
    ]
    
    for test_case in test_cases:
        print(f"\n测试数组: {test_case}")
        for name, func in algorithms:
            try:
                # 创建副本以避免修改原数组
                arr_copy = test_case.copy()
                sorted_arr = func(arr_copy.copy())
                print(f"{name}: {sorted_arr}")
            except Exception as e:
                print(f"{name}: 错误 - {e}")


if __name__ == "__main__":
    print("Python排序算法实现")
    print("=" * 50)
    test_sorting_algorithms()