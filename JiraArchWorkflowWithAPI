from jira import JIRA
from jira.exceptions import JIRAError

class JiraArchWorkflowWithAPI(JiraArchitectureWorkflow):
    def __init__(self, jira_server, auth):
        super().__init__()
        # 连接Jira
        self.jira = JIRA(server=jira_server, basic_auth=auth)

    def sync_jira_issue(self, issue_key):
        """从Jira同步问题的当前状态到状态机"""
        try:
            issue = self.jira.issue(issue_key)
            current_jira_state = issue.fields.status.name
            # 映射Jira状态到状态机（需确保名称一致，若不一致需手动映射）
            if current_jira_state in self.states:
                self.machine.set_state(current_jira_state)
                print(f"同步成功，当前状态：{current_jira_state}")
                return issue
            else:
                print(f"Jira状态「{current_jira_state}」未在状态机中定义")
                return None
        except JIRAError as e:
            print(f"同步失败：{e.text}")
            return None

    def jira_transition(self, issue_key, transition_name, **kwargs):
        """触发Jira过渡并同步状态机"""
        issue = self.sync_jira_issue(issue_key)
        if not issue:
            return False

        # 触发状态机流转（验证合法性）
        if not self.trigger_transition(transition_name):
            return False

        # 触发Jira实际过渡（根据transition_name映射Jira的过渡名称）
        # 这里需要将状态机的trigger名称映射到Jira的过渡名称（需与Jira配置一致）
        jira_trans_map = {
            'to_poc': '进入POC阶段',
            'to_surgery': '进入Surgery阶段',
            'to_poc_self': '重新POC',
            'to_in_dev': '进入开发',
            'to_poc_from_surgery': '退回POC',
            'to_tda': '进入TDA评审',
            'to_in_dev_self': '继续开发',
            'to_tech_forum': '进入技术论坛',
            'to_in_dev_from_tda': '退回开发',
            'to_uat': '进入UAT测试',
            'to_tda_from_tech': '退回TDA',
            'to_prod': '部署生产',
            'to_tech_forum_from_uat': '退回技术论坛',
            'to_done': '标记完成',
            'all_to_done': '强制完成'
        }

        jira_trans_name = jira_trans_map.get(transition_name)
        if not jira_trans_name:
            print(f"未找到Jira过渡映射：{transition_name}")
            return False

        try:
            # 执行Jira过渡（可附带参数如comment）
            self.jira.transition_issue(
                issue,
                transition=jira_trans_name,** kwargs
            )
            print(f"Jira过渡成功：{issue_key} 从「{issue.fields.status.name}」→「{self.jira.issue(issue_key).fields.status.name}」")
            return True
        except JIRAError as e:
            print(f"Jira过渡失败：{e.text}")
            # 回滚状态机（若Jira过渡失败）
            self.machine.set_state(issue.fields.status.name)
            return False
