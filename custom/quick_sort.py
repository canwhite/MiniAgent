def quick_sort(arr):
    """
    快速排序算法
    
    参数:
        arr: 待排序的列表
        
    返回:
        排序后的列表
    """
    # 递归终止条件：列表为空或只有一个元素
    if len(arr) <= 1:
        return arr
    
    # 选择基准元素（这里选择中间元素）
    pivot = arr[len(arr) // 2]
    
    # 将列表分为三部分：小于基准、等于基准、大于基准
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    # 递归排序左右两部分，然后合并
    return quick_sort(left) + middle + quick_sort(right)


def quick_sort_inplace(arr, low=0, high=None):
    """
    原地快速排序算法（修改原数组）
    
    参数:
        arr: 待排序的列表
        low: 起始索引
        high: 结束索引
        
    返回:
        无（原地排序）
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


def partition(arr, low, high):
    """
    分区函数，用于原地快速排序
    
    参数:
        arr: 待排序的列表
        low: 起始索引
        high: 结束索引
        
    返回:
        基准元素的正确位置
    """
    # 选择最右边的元素作为基准
    pivot = arr[high]
    
    # i 指向小于基准的区域的边界
    i = low - 1
    
    # 遍历数组
    for j in range(low, high):
        # 如果当前元素小于或等于基准
        if arr[j] <= pivot:
            # 扩展小于基准的区域
            i += 1
            # 交换元素
            arr[i], arr[j] = arr[j], arr[i]
    
    # 将基准元素放到正确的位置
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    
    return i + 1


def quick_sort_random_pivot(arr, low=0, high=None):
    """
    使用随机基准的快速排序（避免最坏情况）
    
    参数:
        arr: 待排序的列表
        low: 起始索引
        high: 结束索引
        
    返回:
        无（原地排序）
    """
    import random
    
    if high is None:
        high = len(arr) - 1
    
    if low < high:
        # 随机选择一个基准元素
        pivot_index = random.randint(low, high)
        # 将随机选择的基准元素交换到最右边
        arr[pivot_index], arr[high] = arr[high], arr[pivot_index]
        
        # 分区操作
        pivot_index = partition(arr, low, high)
        
        # 递归排序
        quick_sort_random_pivot(arr, low, pivot_index - 1)
        quick_sort_random_pivot(arr, pivot_index + 1, high)


# 测试函数
def test_quick_sort():
    """测试快速排序算法"""
    print("测试快速排序算法")
    print("=" * 50)
    
    # 测试用例
    test_cases = [
        [64, 34, 25, 12, 22, 11, 90],
        [5, 2, 8, 1, 9, 3],
        [1, 2, 3, 4, 5],  # 已排序
        [5, 4, 3, 2, 1],  # 逆序
        [42],  # 单个元素
        [],  # 空列表
        [3, 3, 3, 3, 3],  # 所有元素相同
    ]
    
    for i, test_arr in enumerate(test_cases):
        print(f"测试用例 {i+1}: {test_arr}")
        
        # 方法1：非原地排序
        arr_copy = test_arr.copy()
        sorted_arr = quick_sort(arr_copy)
        print(f"  非原地排序结果: {sorted_arr}")
        
        # 方法2：原地排序
        arr_copy = test_arr.copy()
        quick_sort_inplace(arr_copy)
        print(f"  原地排序结果: {arr_copy}")
        
        # 方法3：随机基准排序
        arr_copy = test_arr.copy()
        quick_sort_random_pivot(arr_copy)
        print(f"  随机基准排序结果: {arr_copy}")
        
        # 验证排序结果是否正确
        expected = sorted(test_arr)
        assert sorted_arr == expected, f"非原地排序错误: {sorted_arr} != {expected}"
        assert arr_copy == expected, f"原地排序错误: {arr_copy} != {expected}"
        print("  ✓ 排序正确")
        print()


if __name__ == "__main__":
    # 运行测试
    test_quick_sort()
    
    # 示例使用
    print("示例使用:")
    print("-" * 30)
    
    # 示例1：使用非原地排序
    arr1 = [64, 34, 25, 12, 22, 11, 90]
    print(f"原始数组: {arr1}")
    sorted_arr1 = quick_sort(arr1.copy())
    print(f"非原地排序后: {sorted_arr1}")
    print()
    
    # 示例2：使用原地排序
    arr2 = [5, 2, 8, 1, 9, 3]
    print(f"原始数组: {arr2}")
    quick_sort_inplace(arr2)
    print(f"原地排序后: {arr2}")
    print()
    
    # 示例3：使用随机基准排序
    arr3 = [7, 6, 5, 4, 3, 2, 1]
    print(f"原始数组: {arr3}")
    quick_sort_random_pivot(arr3)
    print(f"随机基准排序后: {arr3}")