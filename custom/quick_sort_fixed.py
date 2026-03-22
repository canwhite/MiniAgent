def quick_sort(arr):
    """
    快速排序算法实现
    
    参数:
    arr: 待排序的列表
    
    返回:
    排序后的列表
    """
    # 如果列表长度小于等于1，直接返回
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
    原地快速排序算法实现（不创建新列表）
    
    参数:
    arr: 待排序的列表
    low: 起始索引
    high: 结束索引
    
    返回:
    原地排序后的列表
    """
    if high is None:
        high = len(arr) - 1
    
    if low < high:
        # 获取分区点
        pi = partition(arr, low, high)
        
        # 递归排序分区点左边的部分
        quick_sort_inplace(arr, low, pi - 1)
        # 递归排序分区点右边的部分
        quick_sort_inplace(arr, pi + 1, high)
    
    return arr


def partition(arr, low, high):
    """
    分区函数，用于原地快速排序
    
    参数:
    arr: 待排序的列表
    low: 起始索引
    high: 结束索引
    
    返回:
    分区点的索引
    """
    # 选择最右边的元素作为基准
    pivot = arr[high]
    
    # 小于基准的元素的索引
    i = low - 1
    
    for j in range(low, high):
        # 如果当前元素小于或等于基准
        if arr[j] <= pivot:
            i += 1
            # 交换元素
            arr[i], arr[j] = arr[j], arr[i]
    
    # 将基准元素放到正确的位置
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1


def quick_sort_random_pivot(arr):
    """
    使用随机基准的快速排序算法
    
    参数:
    arr: 待排序的列表
    
    返回:
    排序后的列表
    """
    import random
    
    if len(arr) <= 1:
        return arr
    
    # 随机选择基准元素
    pivot_index = random.randint(0, len(arr) - 1)
    pivot = arr[pivot_index]
    
    # 将列表分为三部分
    left = []
    middle = []
    right = []
    
    for x in arr:
        if x < pivot:
            left.append(x)
        elif x == pivot:
            middle.append(x)
        else:
            right.append(x)
    
    return quick_sort_random_pivot(left) + middle + quick_sort_random_pivot(right)


# 测试函数
def test_quick_sort():
    """测试快速排序算法"""
    test_cases = [
        [64, 34, 25, 12, 22, 11, 90],
        [5, 2, 8, 1, 9],
        [1, 2, 3, 4, 5],  # 已排序
        [5, 4, 3, 2, 1],  # 逆序
        [42],  # 单个元素
        [],  # 空列表
        [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5],  # 有重复元素
    ]
    
    print("测试快速排序算法:")
    print("=" * 50)
    
    for i, test_arr in enumerate(test_cases):
        print(f"\n测试用例 {i+1}: {test_arr}")
        
        # 测试第一种实现
        arr_copy = test_arr.copy()
        sorted_arr = quick_sort(arr_copy)
        print(f"  快速排序（新列表）: {sorted_arr}")
        
        # 测试原地排序
        arr_copy = test_arr.copy()
        sorted_inplace = quick_sort_inplace(arr_copy)
        print(f"  原地快速排序: {sorted_inplace}")
        
        # 测试随机基准排序
        arr_copy = test_arr.copy()
        sorted_random = quick_sort_random_pivot(arr_copy)
        print(f"  随机基准快速排序: {sorted_random}")
        
        # 验证排序结果
        expected = sorted(test_arr)
        assert sorted_arr == expected, f"排序错误: 期望 {expected}, 得到 {sorted_arr}"
        assert sorted_inplace == expected, f"原地排序错误: 期望 {expected}, 得到 {sorted_inplace}"
        assert sorted_random == expected, f"随机基准排序错误: 期望 {expected}, 得到 {sorted_random}"
        print("  ✓ 所有实现都正确!")
    
    print("\n" + "=" * 50)
    print("所有测试用例通过!")


# 性能比较函数
def performance_comparison():
    """比较不同快速排序实现的性能"""
    import time
    import random
    
    # 生成测试数据
    sizes = [100, 1000, 10000]
    
    print("\n性能比较:")
    print("=" * 50)
    
    for size in sizes:
        print(f"\n数据大小: {size}")
        test_data = [random.randint(0, 10000) for _ in range(size)]
        
        # 测试第一种实现
        start = time.time()
        quick_sort(test_data.copy())
        time1 = time.time() - start
        
        # 测试原地排序
        start = time.time()
        quick_sort_inplace(test_data.copy())
        time2 = time.time() - start
        
        # 测试随机基准排序
        start = time.time()
        quick_sort_random_pivot(test_data.copy())
        time3 = time.time() - start
        
        print(f"  快速排序（新列表）: {time1:.6f} 秒")
        print(f"  原地快速排序: {time2:.6f} 秒")
        print(f"  随机基准快速排序: {time3:.6f} 秒")


if __name__ == "__main__":
    # 运行测试
    test_quick_sort()
    
    # 运行性能比较（可选，取消注释以运行）
    # performance_comparison()
    
    # 示例用法
    print("\n" + "=" * 50)
    print("示例用法:")
    
    example_arr = [64, 34, 25, 12, 22, 11, 90]
    print(f"原始数组: {example_arr}")
    
    # 使用第一种实现
    sorted_arr = quick_sort(example_arr.copy())
    print(f"快速排序后: {sorted_arr}")
    
    # 使用原地排序
    arr_copy = example_arr.copy()
    quick_sort_inplace(arr_copy)
    print(f"原地快速排序后: {arr_copy}")
    
    # 使用随机基准排序
    arr_copy = example_arr.copy()
    sorted_random = quick_sort_random_pivot(arr_copy)
    print(f"随机基准快速排序后: {sorted_random}")