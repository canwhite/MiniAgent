"""
Python排序算法实现
包含多种常见的排序算法及其性能分析
"""

import random
import time
from typing import List, Callable, Any


def bubble_sort(arr: List[int]) -> List[int]:
    """
    冒泡排序
    时间复杂度：O(n²)
    空间复杂度：O(1)
    稳定排序
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


def selection_sort(arr: List[int]) -> List[int]:
    """
    选择排序
    时间复杂度：O(n²)
    空间复杂度：O(1)
    不稳定排序
    """
    n = len(arr)
    for i in range(n):
        # 找到未排序部分的最小元素
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
    时间复杂度：O(n²) 最好情况O(n)
    空间复杂度：O(1)
    稳定排序
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


def merge_sort(arr: List[int]) -> List[int]:
    """
    归并排序
    时间复杂度：O(n log n)
    空间复杂度：O(n)
    稳定排序
    """
    if len(arr) <= 1:
        return arr
    
    # 分割数组
    mid = len(arr) // 2
    left = arr[:mid]
    right = arr[mid:]
    
    # 递归排序
    merge_sort(left)
    merge_sort(right)
    
    # 合并两个有序数组
    i = j = k = 0
    while i < len(left) and j < len(right):
        if left[i] < right[j]:
            arr[k] = left[i]
            i += 1
        else:
            arr[k] = right[j]
            j += 1
        k += 1
    
    # 复制剩余元素
    while i < len(left):
        arr[k] = left[i]
        i += 1
        k += 1
    
    while j < len(right):
        arr[k] = right[j]
        j += 1
        k += 1
    
    return arr


def quick_sort(arr: List[int]) -> List[int]:
    """
    快速排序
    时间复杂度：平均O(n log n)，最坏O(n²)
    空间复杂度：O(log n)
    不稳定排序
    """
    def _quick_sort(arr: List[int], low: int, high: int):
        if low < high:
            # 分区操作
            pi = partition(arr, low, high)
            # 递归排序左右两部分
            _quick_sort(arr, low, pi - 1)
            _quick_sort(arr, pi + 1, high)
    
    def partition(arr: List[int], low: int, high: int) -> int:
        # 选择最后一个元素作为基准
        pivot = arr[high]
        i = low - 1
        
        for j in range(low, high):
            if arr[j] <= pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
        
        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        return i + 1
    
    _quick_sort(arr, 0, len(arr) - 1)
    return arr


def heap_sort(arr: List[int]) -> List[int]:
    """
    堆排序
    时间复杂度：O(n log n)
    空间复杂度：O(1)
    不稳定排序
    """
    def heapify(arr: List[int], n: int, i: int):
        largest = i  # 初始化最大元素为根
        left = 2 * i + 1
        right = 2 * i + 2
        
        # 如果左子节点存在且大于根
        if left < n and arr[i] < arr[left]:
            largest = left
        
        # 如果右子节点存在且大于当前最大
        if right < n and arr[largest] < arr[right]:
            largest = right
        
        # 如果最大元素不是根
        if largest != i:
            arr[i], arr[largest] = arr[largest], arr[i]
            # 递归堆化受影响的子树
            heapify(arr, n, largest)
    
    n = len(arr)
    
    # 构建最大堆
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    
    # 一个个从堆中取出元素
    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]  # 交换
        heapify(arr, i, 0)  # 堆化剩余部分
    
    return arr


def counting_sort(arr: List[int]) -> List[int]:
    """
    计数排序
    时间复杂度：O(n + k)，k是数据范围
    空间复杂度：O(k)
    稳定排序
    """
    if not arr:
        return arr
    
    # 找到最大值和最小值
    max_val = max(arr)
    min_val = min(arr)
    
    # 创建计数数组
    count_size = max_val - min_val + 1
    count = [0] * count_size
    
    # 统计每个元素出现的次数
    for num in arr:
        count[num - min_val] += 1
    
    # 计算累积计数
    for i in range(1, count_size):
        count[i] += count[i - 1]
    
    # 构建输出数组
    output = [0] * len(arr)
    for num in reversed(arr):
        idx = count[num - min_val] - 1
        output[idx] = num
        count[num - min_val] -= 1
    
    return output


def radix_sort(arr: List[int]) -> List[int]:
    """
    基数排序
    时间复杂度：O(d * (n + k))，d是最大数字的位数
    空间复杂度：O(n + k)
    稳定排序
    """
    if not arr:
        return arr
    
    # 找到最大数确定位数
    max_num = max(arr)
    
    # 从最低位开始，按位进行计数排序
    exp = 1
    while max_num // exp > 0:
        # 使用计数排序按当前位排序
        n = len(arr)
        output = [0] * n
        count = [0] * 10
        
        # 统计当前位的数字出现次数
        for i in range(n):
            index = (arr[i] // exp) % 10
            count[index] += 1
        
        # 计算累积计数
        for i in range(1, 10):
            count[i] += count[i - 1]
        
        # 构建输出数组
        for i in range(n - 1, -1, -1):
            index = (arr[i] // exp) % 10
            output[count[index] - 1] = arr[i]
            count[index] -= 1
        
        # 复制回原数组
        for i in range(n):
            arr[i] = output[i]
        
        exp *= 10
    
    return arr


def bucket_sort(arr: List[int]) -> List[int]:
    """
    桶排序
    时间复杂度：平均O(n + k)，最坏O(n²)
    空间复杂度：O(n + k)
    稳定排序
    """
    if not arr:
        return arr
    
    # 确定桶的数量
    n = len(arr)
    max_val = max(arr)
    min_val = min(arr)
    
    # 计算桶的范围和数量
    bucket_range = max(1, (max_val - min_val) // n + 1)
    bucket_count = (max_val - min_val) // bucket_range + 1
    
    # 创建桶
    buckets = [[] for _ in range(bucket_count)]
    
    # 将元素分配到桶中
    for num in arr:
        idx = (num - min_val) // bucket_range
        buckets[idx].append(num)
    
    # 对每个桶进行排序（这里使用内置排序，也可以使用其他排序）
    result = []
    for bucket in buckets:
        result.extend(sorted(bucket))
    
    return result


def shell_sort(arr: List[int]) -> List[int]:
    """
    希尔排序
    时间复杂度：取决于间隔序列，最好O(n log n)
    空间复杂度：O(1)
    不稳定排序
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


def tim_sort(arr: List[int]) -> List[int]:
    """
    Timsort（Python内置排序使用的算法）
    时间复杂度：O(n log n)
    空间复杂度：O(n)
    稳定排序
    """
    # Python内置的sorted函数使用Timsort算法
    return sorted(arr)


def test_sorting_algorithms():
    """测试所有排序算法"""
    print("=" * 60)
    print("排序算法测试")
    print("=" * 60)
    
    # 测试数据
    test_cases = [
        ([64, 34, 25, 12, 22, 11, 90], "小型数组"),
        ([5, 2, 8, 1, 9, 3, 7, 4, 6, 0], "中型数组"),
        ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "已排序数组"),
        ([10, 9, 8, 7, 6, 5, 4, 3, 2, 1], "逆序数组"),
        ([3, 3, 3, 3, 3, 3, 3, 3, 3, 3], "重复元素数组"),
    ]
    
    # 定义要测试的排序算法
    sorting_algorithms = [
        ("冒泡排序", bubble_sort),
        ("选择排序", selection_sort),
        ("插入排序", insertion_sort),
        ("希尔排序", shell_sort),
        ("归并排序", merge_sort),
        ("快速排序", quick_sort),
        ("堆排序", heap_sort),
        ("计数排序", counting_sort),
        ("基数排序", radix_sort),
        ("桶排序", bucket_sort),
        ("Timsort", tim_sort),
    ]
    
    for arr, description in test_cases:
        print(f"\n测试: {description}")
        print(f"原始数组: {arr}")
        
        for name, func in sorting_algorithms:
            # 复制数组以避免修改原数组
            test_arr = arr.copy()
            try:
                sorted_arr = func(test_arr)
                print(f"{name:10} -> {sorted_arr}")
            except Exception as e:
                print(f"{name:10} -> 错误: {e}")


def benchmark_sorting_algorithms():
    """性能基准测试"""
    print("\n" + "=" * 60)
    print("性能基准测试")
    print("=" * 60)
    
    # 生成测试数据
    sizes = [100, 500, 1000, 5000]
    
    for size in sizes:
        print(f"\n数组大小: {size}")
        
        # 生成随机数组
        random.seed(42)  # 固定种子以确保可重复性
        arr = [random.randint(0, 10000) for _ in range(size)]
        
        # 定义要测试的排序算法（排除一些较慢的算法用于大数组）
        if size <= 1000:
            algorithms = [
                ("冒泡排序", bubble_sort),
                ("选择排序", selection_sort),
                ("插入排序", insertion_sort),
                ("希尔排序", shell_sort),
                ("归并排序", merge_sort),
                ("快速排序", quick_sort),
                ("堆排序", heap_sort),
                ("Timsort", tim_sort),
            ]
        else:
            algorithms = [
                ("希尔排序", shell_sort),
                ("归并排序", merge_sort),
                ("快速排序", quick_sort),
                ("堆排序", heap_sort),
                ("Timsort", tim_sort),
            ]
        
        results = []
        for name, func in algorithms:
            # 复制数组
            test_arr = arr.copy()
            
            # 计时
            start_time = time.time()
            func(test_arr)
            end_time = time.time()
            
            elapsed_time = (end_time - start_time) * 1000  # 转换为毫秒
            results.append((name, elapsed_time))
        
        # 按时间排序并显示结果
        results.sort(key=lambda x: x[1])
        for name, time_ms in results:
            print(f"  {name:10}: {time_ms:.4f} ms")


def visualize_sorting_process():
    """可视化排序过程（简单文本版本）"""
    print("\n" + "=" * 60)
    print("冒泡排序过程可视化")
    print("=" * 60)
    
    arr = [64, 34, 25, 12, 22, 11, 90]
    print(f"初始数组: {arr}")
    print()
    
    n = len(arr)
    for i in range(n):
        swapped = False
        print(f"第 {i+1} 轮:")
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
                print(f"  交换 {arr[j+1]} 和 {arr[j]}: {arr}")
        if not swapped:
            print("  没有交换发生，排序完成")
            break
        print()


def main():
    """主函数"""
    print("Python排序算法实现")
    print("=" * 60)
    
    # 测试所有排序算法
    test_sorting_algorithms()
    
    # 性能基准测试
    benchmark_sorting_algorithms()
    
    # 可视化排序过程
    visualize_sorting_process()
    
    print("\n" + "=" * 60)
    print("总结:")
    print("1. 对于小数组，插入排序通常表现最好")
    print("2. 对于大数组，快速排序、归并排序和堆排序是更好的选择")
    print("3. Timsort（Python内置）是自适应算法，适合大多数情况")
    print("4. 计数排序、基数排序和桶排序在特定条件下（如整数范围小）非常高效")
    print("=" * 60)


if __name__ == "__main__":
    main()