# 初始化并使用
if __name__ == "__main__":
    # Jira连接配置
    JIRA_SERVER = "https://你的Jira域名.atlassian.net"
    AUTH = ("你的邮箱", "你的API Token")
    ISSUE_KEY = "ARCH-100"  # 替换为实际问题Key

    # 初始化工作流管理器
    wf = JiraArchWorkflowWithAPI(jira_server=JIRA_SERVER, auth=AUTH)

    # 从Jira同步问题状态
    wf.sync_jira_issue(ISSUE_KEY)
    print(f"初始状态：{wf.get_current_state()}")

    # 触发一次流转（例如从OPEN→POC）
    wf.jira_transition(
        issue_key=ISSUE_KEY,
        transition_name="to_poc",
        comment="开始概念验证阶段"
    )
    print(f"流转后状态：{wf.get_current_state()}")

    # 再触发一次流转（POC→SURGERY）
    wf.jira_transition(
        issue_key=ISSUE_KEY,
        transition_name="to_surgery",
        comment="完成POC，进入方案设计"
    )
    print(f"最终状态：{wf.get_current_state()}")
