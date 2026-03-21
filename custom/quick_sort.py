def quick_sort(arr):
    """
    快速排序算法
    """
    if len(arr) <= 1:
        return arr
    
    # 选择基准元素（这里选择中间元素）
    pivot = arr[len(arr) // 2]
    
    # 划分数组
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    # 递归排序并合并
    return quick_sort(left) + middle + quick_sort(right)


# 测试示例
if __name__ == "__main__":
    # 测试用例
    test_cases = [
        [64, 34, 25, 12, 22, 11, 90],
        [5, 2, 8, 1, 9],
        [1],
        [],
        [3, 3, 3, 3],
        [9, 8, 7, 6, 5, 4, 3, 2, 1]
    ]
    
    for i, arr in enumerate(test_cases):
        sorted_arr = quick_sort(arr.copy())
        print(f"测试用例 {i+1}:")
        print(f"  原始数组: {arr}")
        print(f"  排序结果: {sorted_arr}")
        print()