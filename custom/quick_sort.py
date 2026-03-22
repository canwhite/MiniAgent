def quick_sort(arr):
    """
    快速排序算法
    
    参数:
    arr: 要排序的列表
    
    返回:
    排序后的列表
    """
    # 如果列表长度小于等于1，直接返回
    if len(arr) <= 1:
        return arr
    
    # 选择基准元素（这里选择中间元素）
    pivot = arr[len(arr) // 2]
    
    # 将元素分为三部分：小于基准、等于基准、大于基准
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    # 递归排序左右两部分，然后合并
    return quick_sort(left) + middle + quick_sort(right)


def quick_sort_in_place(arr, low=0, high=None):
    """
    原地快速排序（不创建新列表）
    
    参数:
    arr: 要排序的列表
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
        quick_sort_in_place(arr, low, pivot_index - 1)
        # 递归排序基准元素右边的子数组
        quick_sort_in_place(arr, pivot_index + 1, high)


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
    
    # i指向小于基准的区域的边界
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
        [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5],  # 包含重复元素
    ]
    
    for i, test_arr in enumerate(test_cases):
        print(f"\n测试用例 {i+1}: {test_arr}")
        
        # 测试第一种实现（创建新列表）
        arr_copy = test_arr.copy()
        sorted_arr = quick_sort(arr_copy)
        print(f"  快速排序（新列表）: {sorted_arr}")
        
        # 测试第二种实现（原地排序）
        arr_in_place = test_arr.copy()
        quick_sort_in_place(arr_in_place)
        print(f"  快速排序（原地）: {arr_in_place}")
        
        # 验证排序结果是否正确
        expected = sorted(test_arr)
        if sorted_arr == expected and arr_in_place == expected:
            print("  ✓ 排序正确")
        else:
            print("  ✗ 排序错误")
    
    print("\n" + "=" * 50)
    print("测试完成！")


if __name__ == "__main__":
    test_quick_sort()