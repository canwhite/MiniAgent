#!/usr/bin/env python3
"""
排序算法使用示例
"""

from sorting_algorithms import *

def main():
    # 示例数组
    numbers = [64, 34, 25, 12, 22, 11, 90, 45, 78, 33]
    print("原始数组:", numbers)
    print("-" * 50)
    
    # 1. 冒泡排序
    print("1. 冒泡排序结果:", bubble_sort(numbers.copy()))
    
    # 2. 选择排序
    print("2. 选择排序结果:", selection_sort(numbers.copy()))
    
    # 3. 插入排序
    print("3. 插入排序结果:", insertion_sort(numbers.copy()))
    
    # 4. 归并排序
    print("4. 归并排序结果:", merge_sort(numbers.copy()))
    
    # 5. 快速排序
    print("5. 快速排序结果:", quick_sort(numbers.copy()))
    
    # 6. 堆排序
    print("6. 堆排序结果:", heap_sort(numbers.copy()))
    
    # 7. 计数排序（适用于整数）
    int_numbers = [4, 2, 2, 8, 3, 3, 1]
    print("\n7. 计数排序示例:")
    print("   原始数组:", int_numbers)
    print("   排序结果:", counting_sort(int_numbers.copy()))
    
    # 8. 基数排序（适用于非负整数）
    radix_numbers = [170, 45, 75, 90, 802, 24, 2, 66]
    print("\n8. 基数排序示例:")
    print("   原始数组:", radix_numbers)
    print("   排序结果:", radix_sort(radix_numbers.copy()))
    
    # 9. 性能比较示例
    print("\n" + "=" * 50)
    print("性能比较（小数组）:")
    
    import time
    import random
    
    # 生成随机测试数据
    test_data = [random.randint(1, 1000) for _ in range(100)]
    
    algorithms = [
        ("冒泡排序", bubble_sort),
        ("选择排序", selection_sort),
        ("插入排序", insertion_sort),
        ("归并排序", merge_sort),
        ("快速排序", quick_sort),
        ("堆排序", heap_sort),
    ]
    
    for name, func in algorithms:
        data_copy = test_data.copy()
        start_time = time.time()
        func(data_copy)
        elapsed = time.time() - start_time
        print(f"   {name}: {elapsed:.6f} 秒")
    
    print("\n" + "=" * 50)
    print("算法特点总结:")
    print("1. 冒泡排序: 简单但效率低，适合教学")
    print("2. 选择排序: 简单但不稳定")
    print("3. 插入排序: 对小数组或基本有序数组高效")
    print("4. 归并排序: 稳定，时间复杂度O(n log n)，需要额外空间")
    print("5. 快速排序: 平均性能最好，但不稳定")
    print("6. 堆排序: 原地排序，时间复杂度O(n log n)")
    print("7. 计数排序: 适用于整数范围较小的情况")
    print("8. 基数排序: 适用于非负整数")
    print("9. 希尔排序: 改进的插入排序")
    print("10. 桶排序: 适用于均匀分布的数据")


if __name__ == "__main__":
    main()