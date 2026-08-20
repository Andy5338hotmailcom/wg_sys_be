import webview
import tkinter as tk
from tkinter import messagebox
import platform

def create_exit_dialog():
    """创建跨平台退出确认对话框"""
    root = tk.Tk()
    root.withdraw()
    return messagebox.askokcancel(
        "退出确认",
        "您确定关闭大雁系统虚拟机吗？",
        icon='question'
    )

if __name__ == '__main__':
    window = webview.create_window(
        title="大雁BE系统",
        url="index.html",
        confirm_close=False  # 必须禁用原生确认
    )

    def on_closing():
        if not create_exit_dialog():
            return False  # 取消关闭
        # 不返回或返回True则允许关闭

    window.events.closing += on_closing
    webview.start()