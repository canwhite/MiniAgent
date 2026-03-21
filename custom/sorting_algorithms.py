"""
Python实现的各种排序算法
包含：冒泡排序、选择排序、插入排序、快速排序、归并排序、堆排序、希尔排序
"""

import random
import time
from typing import List, Callable


def bubble_sort(arr: List[int]) -> List[int]:
    """
    冒泡排序
    时间复杂度：O(n²)
    空间复杂度：O(1)
    """
    n = len(arr)
    for i in range(n):
        # 标记是否发生交换，用于优化
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        # 如果没有发生交换，说明已经有序
        if not swapped:
            break
    return arr


def selection_sort(arr: List[int]) -> List[int]:
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


def insertion_sort(arr: List[int]) -> List[int]:
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


def quick_sort(arr: List[int]) -> List[int]:
    """
    快速排序
    时间复杂度：平均O(n log n)，最坏O(n²)
    空间复杂度：O(log n)
    """
    def _quick_sort(arr: List[int], low: int, high: int):
        if low < high:
            # 分区操作，返回分区点的索引
            pi = partition(arr, low, high)
            # 递归排序左右两部分
            _quick_sort(arr, low, pi - 1)
            _quick_sort(arr, pi + 1, high)
    
    def partition(arr: List[int], low: int, high: int) -> int:
        # 选择最右边的元素作为基准
        pivot = arr[high]
        i = low - 1  # 小于基准的元素的边界
        
        for j in range(low, high):
            if arr[j] <= pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
        
        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        return i + 1
    
    _quick_sort(arr, 0, len(arr) - 1)
    return arr


def merge_sort(arr: List[int]) -> List[int]:
    """
    归并排序
    时间复杂度：O(n log n)
    空间复杂度：O(n)
    """
    def _merge_sort(arr: List[int], left: int, right: int):
        if left < right:
            mid = (left + right) // 2
            _merge_sort(arr, left, mid)
            _merge_sort(arr, mid + 1, right)
            merge(arr, left, mid, right)
    
    def merge(arr: List[int], left: int, mid: int, right: int):
        # 创建临时数组
        n1 = mid - left + 1
        n2 = right - mid
        
        L = arr[left:mid + 1]
        R = arr[mid + 1:right + 1]
        
        # 合并两个有序数组
        i = j = 0
        k = left
        
        while i < n1 and j < n2:
            if L[i] <= R[j]:
                arr[k] = L[i]
                i += 1
            else:
                arr[k] = R[j]
                j += 1
            k += 1
        
        # 复制剩余元素
        while i < n1:
            arr[k] = L[i]
            i += 1
            k += 1
        
        while j < n2:
            arr[k] = R[j]
            j += 1
            k += 1
    
    _merge_sort(arr, 0, len(arr) - 1)
    return arr


def heap_sort(arr: List[int]) -> List[int]:
    """
    堆排序
    时间复杂度：O(n log n)
    空间复杂度：O(1)
    """
    def heapify(arr: List[int], n: int, i: int):
        largest = i  # 初始化最大值为根节点
        left = 2 * i + 1
        right = 2 * i + 2
        
        # 如果左子节点存在且大于根节点
        if left < n and arr[left] > arr[largest]:
            largest = left
        
        # 如果右子节点存在且大于当前最大值
        if right < n and arr[right] > arr[largest]:
            largest = right
        
        # 如果最大值不是根节点
        if largest != i:
            arr[i], arr[largest] = arr[largest], arr[i]
            # 递归堆化受影响的子树
            heapify(arr, n, largest)
    
    n = len(arr)
    
    # 构建最大堆
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    
    # 一个个从堆顶取出元素
    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]  # 交换
        heapify(arr, i, 0)  # 堆化剩余部分
    
    return arr


def shell_sort(arr: List[int]) -> List[int]:
    """
    希尔排序（缩小增量排序）
    时间复杂度：取决于间隔序列，最好O(n log² n)
    空间复杂度：O(1)
    """
    n = len(arr)
    gap = n // 2  # 初始间隔
    
    while gap > 0:
        for i in range(gap, n):
            temp = arr[i]
            j = i
            # 对间隔为gap的元素进行插入排序
            while j >= gap and arr[j - gap] > temp:
                arr[j] = arr[j - gap]
                j -= gap
            arr[j] = temp
        gap //= 2  # 缩小间隔
    
    return arr


def counting_sort(arr: List[int]) -> List[int]:
    """
    计数排序（适用于整数且范围不大的情况）
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
    
    # 计数每个元素出现的次数
    for num in arr:
        count[num - min_val] += 1
    
    # 重建排序后的数组
    idx = 0
    for i in range(count_size):
        while count[i] > 0:
            arr[idx] = i + min_val
            idx += 1
            count[i] -= 1
    
    return arr


def test_sorting_algorithms():
    """测试所有排序算法"""
    print("测试排序算法...")
    
    # 测试数据
    test_cases = [
        [64, 34, 25, 12, 22, 11, 90],
        [5, 2, 8, 1, 9],
        [1, 2, 3, 4, 5],  # 已排序
        [5, 4, 3, 2, 1],  # 逆序
        [42],
        [],  # 空数组
        [3, 3, 3, 3, 3],  # 所有元素相同
    ]
    
    # 所有排序算法
    algorithms = {
        "冒泡排序": bubble_sort,
        "选择排序": selection_sort,
        "插入排序": insertion_sort,
        "快速排序": quick_sort,
        "归并排序": merge_sort,
        "堆排序": heap_sort,
        "希尔排序": shell_sort,
        "计数排序": counting_sort,
    }
    
    for name, algorithm in algorithms.items():
        print(f"\n{name}:")
        for i, test_arr in enumerate(test_cases):
            # 复制数组，避免修改原数组
            arr_copy = test_arr.copy()
            try:
                sorted_arr = algorithm(arr_copy)
                print(f"  测试 {i+1}: {test_arr} -> {sorted_arr}")
            except Exception as e:
                print(f"  测试 {i+1}: 错误 - {e}")


def benchmark_sorting_algorithms():
    """性能测试：比较不同排序算法的执行时间"""
    print("\n性能测试：比较不同排序算法的执行时间")
    
    # 生成测试数据
    sizes = [100, 500, 1000, 5000]
    algorithms = {
        "冒泡排序": bubble_sort,
        "选择排序": selection_sort,
        "插入排序": insertion_sort,
        "快速排序": quick_sort,
        "归并排序": merge_sort,
        "堆排序": heap_sort,
        "希尔排序": shell_sort,
        "计数排序": counting_sort,
    }
    
    for size in sizes:
        print(f"\n数组大小: {size}")
        # 生成随机数组
        arr = [random.randint(0, 10000) for _ in range(size)]
        
        for name, algorithm in algorithms.items():
            # 复制数组，避免修改原数组
            arr_copy = arr.copy()
            
            # 测量执行时间
            start_time = time.time()
            algorithm(arr_copy)
            end_time = time.time()
            
            execution_time = (end_time - start_time) * 1000  # 转换为毫秒
            print(f"  {name}: {execution_time:.2f} ms")


if __name__ == "__main__":
    print("=" * 60)
    print("Python排序算法实现")
    print("=" * 60)
    
    # 测试所有算法
    test_sorting_algorithms()
    
    # 性能测试（对于小规模数据）
    benchmark_sorting_algorithms()
    
    print("\n" + "=" * 60)
    print("使用示例：")
    print("=" * 60)
    
    # 使用示例
    example_arr = [64, 34, 25, 12, 22, 11, 90]
    print(f"原始数组: {example_arr}")
    
    # 使用快速排序
    sorted_arr = quick_sort(example_arr.copy())
    print(f"快速排序后: {sorted_arr}")
    
    # 使用归并排序
    sorted_arr = merge_sort(example_arr.copy())
    print(f"归并排序后: {sorted_arr}")