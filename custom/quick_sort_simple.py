def quick_sort(arr):
    """
    快速排序算法 - 简洁版本
    
    参数:
    arr: 待排序的列表
    
    返回:
    排序后的列表
    """
    if len(arr) <= 1:
        return arr
    
    # 选择基准元素
    pivot = arr[len(arr) // 2]
    
    # 分区
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    # 递归排序并合并
    return quick_sort(left) + middle + quick_sort(right)


def quick_sort_inplace(arr, low=0, high=None):
    """
    原地快速排序 - 节省内存
    
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
        # 分区
        pivot_index = partition(arr, low, high)
        
        # 递归排序左右两部分
        quick_sort_inplace(arr, low, pivot_index - 1)
        quick_sort_inplace(arr, pivot_index + 1, high)
    
    return arr


def partition(arr, low, high):
    """
    分区函数
    
    参数:
    arr: 待排序的列表
    low: 起始索引
    high: 结束索引
    
    返回:
    基准元素的最终位置
    """
    # 选择最右边的元素作为基准
    pivot = arr[high]
    
    # i 指向小于基准的最后一个元素
    i = low - 1
    
    # 遍历数组
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    
    # 将基准放到正确位置
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1


# 快速排序的优化版本 - 三路快速排序（处理大量重复元素）
def quick_sort_3way(arr, low=0, high=None):
    """
    三路快速排序 - 优化处理重复元素
    
    参数:
    arr: 待排序的列表
    low: 起始索引
    high: 结束索引
    
    返回:
    排序后的列表
    """
    if high is None:
        high = len(arr) - 1
    
    if low < high:
        # 选择基准
        pivot = arr[low]
        
        # 三路分区
        lt = low      # arr[low..lt-1] < pivot
        gt = high     # arr[gt+1..high] > pivot
        i = low + 1   # arr[lt..i-1] == pivot
        
        while i <= gt:
            if arr[i] < pivot:
                arr[lt], arr[i] = arr[i], arr[lt]
                lt += 1
                i += 1
            elif arr[i] > pivot:
                arr[i], arr[gt] = arr[gt], arr[i]
                gt -= 1
            else:
                i += 1
        
        # 递归排序小于和大于基准的部分
        quick_sort_3way(arr, low, lt - 1)
        quick_sort_3way(arr, gt + 1, high)
    
    return arr


# 使用示例
if __name__ == "__main__":
    # 测试数据
    test_data = [
        [64, 34, 25, 12, 22, 11, 90],
        [5, 2, 8, 1, 9],
        [1, 2, 3, 4, 5],
        [5, 4, 3, 2, 1],
        [42],
        [],
        [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5],
    ]
    
    print("快速排序算法演示")
    print("=" * 50)
    
    for i, data in enumerate(test_data):
        print(f"\n测试 {i+1}: {data}")
        
        # 方法1: 标准快速排序
        result1 = quick_sort(data.copy())
        print(f"  标准快速排序: {result1}")
        
        # 方法2: 原地快速排序
        result2 = data.copy()
        quick_sort_inplace(result2)
        print(f"  原地快速排序: {result2}")
        
        # 方法3: 三路快速排序（处理重复元素）
        result3 = data.copy()
        quick_sort_3way(result3)
        print(f"  三路快速排序: {result3}")
        
        # 验证结果
        expected = sorted(data)
        assert result1 == expected, f"标准快速排序错误"
        assert result2 == expected, f"原地快速排序错误"
        assert result3 == expected, f"三路快速排序错误"
        print("  ✓ 正确")
    
    print("\n" + "=" * 50)
    print("所有测试通过!")
    
    # 实际使用示例
    print("\n实际使用示例:")
    numbers = [64, 34, 25, 12, 22, 11, 90]
    print(f"原始数组: {numbers}")
    
    # 使用标准快速排序
    sorted_numbers = quick_sort(numbers.copy())
    print(f"排序后: {sorted_numbers}")
    
    # 使用原地排序
    numbers_copy = numbers.copy()
    quick_sort_inplace(numbers_copy)
    print(f"原地排序后: {numbers_copy}")