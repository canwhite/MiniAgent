"""
排序算法使用示例
"""

from sorting_algorithms import *

def simple_examples():
    """简单示例"""
    print("=" * 50)
    print("排序算法简单示例")
    print("=" * 50)
    
    # 示例数组
    numbers = [64, 34, 25, 12, 22, 11, 90]
    print(f"原始数组: {numbers}")
    print()
    
    # 冒泡排序
    bubble_sorted = bubble_sort(numbers.copy())
    print(f"冒泡排序结果: {bubble_sorted}")
    
    # 快速排序
    quick_sorted = quick_sort(numbers.copy())
    print(f"快速排序结果: {quick_sorted}")
    
    # 归并排序
    merge_sorted = merge_sort(numbers.copy())
    print(f"归并排序结果: {merge_sorted}")
    
    # Python内置排序（Timsort）
    python_sorted = sorted(numbers)
    print(f"Python内置排序: {python_sorted}")


def compare_sorting_algorithms():
    """比较不同排序算法的性能"""
    print("\n" + "=" * 50)
    print("排序算法性能比较")
    print("=" * 50)
    
    import random
    import time
    
    # 生成测试数据
    random.seed(42)
    test_data = [random.randint(1, 1000) for _ in range(100)]
    
    algorithms = [
        ("冒泡排序", bubble_sort),
        ("选择排序", selection_sort),
        ("插入排序", insertion_sort),
        ("希尔排序", shell_sort),
        ("归并排序", merge_sort),
        ("快速排序", quick_sort),
        ("堆排序", heap_sort),
    ]
    
    print(f"测试数据大小: {len(test_data)}")
    print()
    
    results = []
    for name, func in algorithms:
        data_copy = test_data.copy()
        start_time = time.time()
        func(data_copy)
        end_time = time.time()
        elapsed = (end_time - start_time) * 1000  # 毫秒
        results.append((name, elapsed))
        print(f"{name:10}: {elapsed:.4f} ms")
    
    # 找出最快的算法
    fastest = min(results, key=lambda x: x[1])
    print(f"\n最快的算法: {fastest[0]} ({fastest[1]:.4f} ms)")


def sorting_for_specific_needs():
    """针对特定需求的排序选择"""
    print("\n" + "=" * 50)
    print("针对特定需求的排序选择")
    print("=" * 50)
    
    # 场景1：小数组
    small_array = [5, 2, 8, 1, 9]
    print("场景1: 小数组")
    print(f"  数组: {small_array}")
    print(f"  推荐: 插入排序 (简单高效)")
    print(f"  结果: {insertion_sort(small_array.copy())}")
    
    # 场景2：几乎已排序的数组
    nearly_sorted = [1, 2, 3, 5, 4, 6, 7, 8, 9, 10]
    print("\n场景2: 几乎已排序的数组")
    print(f"  数组: {nearly_sorted}")
    print(f"  推荐: 插入排序或冒泡排序 (自适应)")
    print(f"  结果: {insertion_sort(nearly_sorted.copy())}")
    
    # 场景3：大数组
    import random
    random.seed(123)
    large_array = [random.randint(1, 10000) for _ in range(1000)]
    print("\n场景3: 大数组")
    print(f"  数组大小: {len(large_array)}")
    print(f"  推荐: 快速排序、归并排序或堆排序")
    print(f"  快速排序示例: 前10个元素 {quick_sort(large_array.copy())[:10]}")
    
    # 场景4：整数范围有限
    limited_range = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
    print("\n场景4: 整数范围有限")
    print(f"  数组: {limited_range}")
    print(f"  推荐: 计数排序")
    print(f"  结果: {counting_sort(limited_range.copy())}")
    
    # 场景5：需要稳定排序
    students = [
        ("Alice", 85),
        ("Bob", 90),
        ("Charlie", 85),
        ("David", 88),
        ("Eve", 90)
    ]
    print("\n场景5: 需要稳定排序（保持相同分数的原始顺序）")
    print(f"  学生成绩: {students}")
    print(f"  推荐: 归并排序、插入排序、冒泡排序")
    print("  注意: 需要自定义比较函数")


def custom_sorting_example():
    """自定义排序示例"""
    print("\n" + "=" * 50)
    print("自定义排序示例")
    print("=" * 50)
    
    # 示例1：按字符串长度排序
    words = ["apple", "banana", "cherry", "date", "elderberry", "fig"]
    print("示例1: 按字符串长度排序")
    print(f"  原始: {words}")
    sorted_by_length = sorted(words, key=len)
    print(f"  按长度排序: {sorted_by_length}")
    
    # 示例2：按多个条件排序
    people = [
        {"name": "Alice", "age": 25, "score": 85},
        {"name": "Bob", "age": 30, "score": 90},
        {"name": "Charlie", "age": 25, "score": 88},
        {"name": "David", "age": 30, "score": 85}
    ]
    print("\n示例2: 按多个条件排序（先按年龄，再按分数）")
    print("  原始数据:")
    for p in people:
        print(f"    {p}")
    
    sorted_people = sorted(people, key=lambda x: (x["age"], x["score"]))
    print("\n  排序后:")
    for p in sorted_people:
        print(f"    {p}")
    
    # 示例3：降序排序
    numbers = [5, 2, 8, 1, 9, 3]
    print("\n示例3: 降序排序")
    print(f"  原始: {numbers}")
    descending = sorted(numbers, reverse=True)
    print(f"  降序: {descending}")


def sorting_algorithm_visualization():
    """排序算法可视化（简单文本版）"""
    print("\n" + "=" * 50)
    print("插入排序过程可视化")
    print("=" * 50)
    
    arr = [5, 2, 8, 1, 9]
    print(f"初始数组: {arr}")
    print()
    
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        print(f"第 {i} 步: 处理元素 {key}")
        
        while j >= 0 and key < arr[j]:
            print(f"  移动 {arr[j]} 到位置 {j+1}")
            arr[j + 1] = arr[j]
            j -= 1
        
        arr[j + 1] = key
        print(f"  插入 {key} 到位置 {j+1}")
        print(f"  当前数组: {arr}")
        print()


def main():
    """主函数"""
    print("排序算法使用示例")
    print("=" * 50)
    
    # 运行各个示例
    simple_examples()
    compare_sorting_algorithms()
    sorting_for_specific_needs()
    custom_sorting_example()
    sorting_algorithm_visualization()
    
    print("\n" + "=" * 50)
    print("使用建议:")
    print("1. 对于大多数情况，使用Python内置的sorted()或list.sort()")
    print("2. 学习算法时，理解不同排序算法的原理和适用场景")
    print("3. 在实际项目中，根据数据特性和性能要求选择合适的算法")
    print("=" * 50)


if __name__ == "__main__":
    main()