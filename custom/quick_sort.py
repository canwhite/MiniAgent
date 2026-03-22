def quick_sort(arr):
    """
    快速排序算法
    
    参数:
    arr: 要排序的列表
    
    返回:
    排序后的列表
    """
    # 基本情况：如果列表长度小于等于1，直接返回
    if len(arr) <= 1:
        return arr
    
    # 选择基准元素（这里选择中间元素）
    pivot = arr[len(arr) // 2]
    
    # 将列表分成三部分：小于基准、等于基准、大于基准
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    # 递归排序左右两部分，然后合并
    return quick_sort(left) + middle + quick_sort(right)


def quick_sort_inplace(arr, low=0, high=None):
    """
    原地快速排序算法（不创建新列表）
    
    参数:
    arr: 要排序的列表
    low: 起始索引
    high: 结束索引
    
    返回:
    原地排序后的列表
    """
    if high is None:
        high = len(arr) - 1
    
    if low < high:
        # 分区操作，返回基准元素的正确位置
        pivot_index = partition(arr, low, high)
        
        # 递归排序基准元素左边的子数组
        quick_sort_inplace(arr, low, pivot_index - 1)
        # 递归排序基准元素右边的子数组
        quick_sort_inplace(arr, pivot_index + 1, high)
    
    return arr


def partition(arr, low, high):
    """
    分区函数，用于原地快速排序
    
    参数:
    arr: 要排序的列表
    low: 起始索引
    high: 结束索引
    
    返回:
    基准元素的正确位置
    """
    # 选择最右边的元素作为基准
    pivot = arr[high]
    
    # i 指向小于基准的元素的边界
    i = low - 1
    
    # 遍历数组
    for j in range(low, high):
        # 如果当前元素小于等于基准
        if arr[j] <= pivot:
            # 增加 i 并交换 arr[i] 和 arr[j]
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    
    # 将基准元素放到正确的位置
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    
    return i + 1


def quick_sort_random_pivot(arr, low=0, high=None):
    """
    使用随机基准的快速排序（避免最坏情况）
    
    参数:
    arr: 要排序的列表
    low: 起始索引
    high: 结束索引
    
    返回:
    原地排序后的列表
    """
    if high is None:
        high = len(arr) - 1
    
    if low < high:
        # 随机选择基准元素
        import random
        pivot_index = random.randint(low, high)
        # 将随机选择的基准元素交换到最右边
        arr[pivot_index], arr[high] = arr[high], arr[pivot_index]
        
        # 分区操作
        pivot_index = partition(arr, low, high)
        
        # 递归排序
        quick_sort_random_pivot(arr, low, pivot_index - 1)
        quick_sort_random_pivot(arr, pivot_index + 1, high)
    
    return arr


# 测试函数
def test_quick_sort():
    """测试快速排序算法"""
    print("测试快速排序算法")
    print("=" * 50)
    
    # 测试用例
    test_cases = [
        [64, 34, 25, 12, 22, 11, 90],
        [5, 2, 8, 1, 9, 3],
        [1, 2, 3, 4, 5],
        [5, 4, 3, 2, 1],
        [42],
        [],
        [3, 3, 3, 3, 3],
        [1, 3, 2, 5, 4, 6, 7, 9, 8]
    ]
    
    for i, test_arr in enumerate(test_cases):
        print(f"测试用例 {i+1}: {test_arr}")
        
        # 复制测试数组，因为原地排序会修改原数组
        arr1 = test_arr.copy()
        arr2 = test_arr.copy()
        arr3 = test_arr.copy()
        
        # 测试三种不同的快速排序实现
        result1 = quick_sort(arr1)
        result2 = quick_sort_inplace(arr2)
        result3 = quick_sort_random_pivot(arr3)
        
        print(f"  简单快速排序: {result1}")
        print(f"  原地快速排序: {result2}")
        print(f"  随机基准快速排序: {result3}")
        
        # 验证所有结果是否相同
        if result1 == result2 == result3:
            print(f"  ✓ 所有实现结果一致")
        else:
            print(f"  ✗ 结果不一致！")
        
        print()


if __name__ == "__main__":
    # 运行测试
    test_quick_sort()
    
    # 示例使用
    print("示例使用:")
    print("-" * 30)
    
    # 示例1：简单快速排序
    arr = [64, 34, 25, 12, 22, 11, 90]
    print(f"原始数组: {arr}")
    sorted_arr = quick_sort(arr.copy())
    print(f"简单快速排序后: {sorted_arr}")
    
    # 示例2：原地快速排序
    arr2 = arr.copy()
    quick_sort_inplace(arr2)
    print(f"原地快速排序后: {arr2}")
    
    # 示例3：随机基准快速排序
    arr3 = arr.copy()
    quick_sort_random_pivot(arr3)
    print(f"随机基准快速排序后: {arr3}")