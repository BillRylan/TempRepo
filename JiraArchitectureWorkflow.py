from transitions import Machine

class JiraArchitectureWorkflow:
    def __init__(self):
        # 定义所有状态
        self.states = [
            'OPEN', 'POC', 'SURGERY', 'IN_DEV', 'TDA', 
            'TECH_FORUM', 'UAT', 'PROD', 'DONE'
        ]
        
        # 定义状态流转规则（trigger名称, 源状态, 目标状态）
        self.transitions = [
            {'trigger': 'to_poc', 'source': 'OPEN', 'dest': 'POC'},
            {'trigger': 'to_surgery', 'source': 'POC', 'dest': 'SURGERY'},
            {'trigger': 'to_poc_self', 'source': 'POC', 'dest': 'POC'},  # 自循环
            {'trigger': 'to_in_dev', 'source': 'SURGERY', 'dest': 'IN_DEV'},
            {'trigger': 'to_poc_from_surgery', 'source': 'SURGERY', 'dest': 'POC'},
            {'trigger': 'to_tda', 'source': 'IN_DEV', 'dest': 'TDA'},
            {'trigger': 'to_in_dev_self', 'source': 'IN_DEV', 'dest': 'IN_DEV'},  # 自循环
            {'trigger': 'to_tech_forum', 'source': 'TDA', 'dest': 'TECH_FORUM'},
            {'trigger': 'to_in_dev_from_tda', 'source': 'TDA', 'dest': 'IN_DEV'},
            {'trigger': 'to_uat', 'source': 'TECH_FORUM', 'dest': 'UAT'},
            {'trigger': 'to_tda_from_tech', 'source': 'TECH_FORUM', 'dest': 'TDA'},
            {'trigger': 'to_prod', 'source': 'UAT', 'dest': 'PROD'},
            {'trigger': 'to_tech_forum_from_uat', 'source': 'UAT', 'dest': 'TECH_FORUM'},
            {'trigger': 'to_done', 'source': 'PROD', 'dest': 'DONE'},
            {'trigger': 'to_uat_from_prod', 'source': 'PROD', 'dest': 'UAT'},
            {'trigger': 'all_to_done', 'source': '*', 'dest': 'DONE'}  # 所有状态可直接到DONE
        ]
        
        # 初始化状态机
        self.machine = Machine(
            model=self,
            states=self.states,
            transitions=self.transitions,
            initial='OPEN'
        )

    def get_current_state(self):
        """获取当前状态"""
        return self.state

    def trigger_transition(self, transition_name):
        """触发状态流转（需确保流转合法）"""
        if hasattr(self, transition_name):
            getattr(self, transition_name)()
            return True
        else:
            print(f"不支持的流转：{transition_name}")
            return False
