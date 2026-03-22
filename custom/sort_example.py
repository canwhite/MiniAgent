"""
排序算法使用示例
"""

# 导入排序算法
from sorting_algorithms import *

def main():
    # 示例数据
    numbers = [64, 34, 25, 12, 22, 11, 90]
    print("原始数组:", numbers)
    print()
    
    # 使用不同的排序算法
    print("1. 冒泡排序:")
    sorted_bubble = bubble_sort(numbers.copy())
    print(f"   结果: {sorted_bubble}")
    print()
    
    print("2. 选择排序:")
    sorted_selection = selection_sort(numbers.copy())
    print(f"   结果: {sorted_selection}")
    print()
    
    print("3. 插入排序:")
    sorted_insertion = insertion_sort(numbers.copy())
    print(f"   结果: {sorted_insertion}")
    print()
    
    print("4. 归并排序:")
    sorted_merge = merge_sort(numbers.copy())
    print(f"   结果: {sorted_merge}")
    print()
    
    print("5. 快速排序:")
    sorted_quick = quick_sort(numbers.copy())
    print(f"   结果: {sorted_quick}")
    print()
    
    print("6. 堆排序:")
    sorted_heap = heap_sort(numbers.copy())
    print(f"   结果: {sorted_heap}")
    print()
    
    # 字符串排序示例
    words = ["banana", "apple", "cherry", "date", "blueberry"]
    print("字符串排序示例:")
    print(f"   原始: {words}")
    print(f"   排序后: {quick_sort(words.copy())}")
    print()
    
    # 自定义对象排序示例
    class Student:
        def __init__(self, name, score):
            self.name = name
            self.score = score
        
        def __repr__(self):
            return f"{self.name}({self.score})"
        
        def __lt__(self, other):
            return self.score < other.score
    
    students = [
        Student("Alice", 85),
        Student("Bob", 92),
        Student("Charlie", 78),
        Student("David", 95),
    ]
    
    print("自定义对象排序示例:")
    print(f"   原始: {students}")
    
    # 使用快速排序对自定义对象排序
    sorted_students = quick_sort(students.copy())
    print(f"   按分数排序: {sorted_students}")


if __name__ == "__main__":
    main()