from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from jira import JIRA
from jira.exceptions import JIRAError
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.urandom(24)  # 用于会话管理


# 添加上下文处理器，让now变量在所有模板中可用
@app.context_processor
def inject_now():
    return {'now': datetime.utcnow()}


def get_jira_instance():
    """从会话信息创建JIRA实例"""
    if 'jira_auth' not in session or 'jira_url' not in session:
        return None
    username, password = session['jira_auth']
    return JIRA(
        options={'server': session['jira_url']},
        basic_auth=(username, password)
    )


@app.route('/')
def index():
    """首页路由 - 已登录则显示dashboard，否则显示登录页"""
    if 'jira_auth' in session:
        return render_template('dashboard.html')
    return render_template('login.html')


@app.route('/login', methods=['POST'])
def login():
    """处理 Jira 登录请求"""
    username = request.form.get('username')
    password = request.form.get('password')
    jira_url = request.form.get('jira_url')
    
    # 验证输入
    if not all([username, password, jira_url]):
        return render_template('login.html', error="All fields are required")
    
    # 尝试连接Jira
    try:
        jira_options = {
            'server': jira_url.rstrip('/'),
            'verify': True
        }
        
        jira = JIRA(options=jira_options, basic_auth=(username, password))
        user_info = jira.myself()
        
        # 保存会话信息
        session['jira_auth'] = (username, password)
        session['jira_url'] = jira_url.rstrip('/')
        session['user_info'] = user_info
        
        return redirect(url_for('index'))
    
    except JIRAError as e:
        if e.status_code == 401:
            return render_template('login.html', error="Invalid username or password")
        elif e.status_code == 403:
            return render_template('login.html', error="Permission denied")
        elif e.status_code == 404:
            return render_template('login.html', error="Jira URL not found")
        else:
            return render_template('login.html', error=f"Jira error: {str(e)}")
    except Exception as e:
        return render_template('login.html', error=f"Connection error: {str(e)}")


@app.route('/logout')
def logout():
    """登出功能"""
    session.pop('jira_auth', None)
    session.pop('user_info', None)
    session.pop('jira_url', None)
    return redirect(url_for('index'))


@app.route('/create-issue', methods=['GET', 'POST'])
def create_issue():
    """创建 Jira Issue 功能"""
    jira = get_jira_instance()
    if not jira:
        return redirect(url_for('index'))
    
    # 获取项目列表
    projects = []
    try:
        projects = sorted(jira.projects(), key=lambda x: x.name)
    except JIRAError as e:
        return render_template('create_issue.html', projects=[], error=f"Error fetching projects: {str(e)}")
    
    if request.method == 'POST':
        # 处理创建issue请求
        try:
            issue_dict = {
                'project': {'id': request.form.get('project_id')},
                'summary': request.form.get('summary'),
                'description': request.form.get('description'),
                'issuetype': {'id': request.form.get('issue_type')},
            }
            issue = jira.create_issue(fields=issue_dict)
            return redirect(url_for('issue_detail', issue_key=issue.key))
        except JIRAError as e:
            return render_template('create_issue.html', 
                                  projects=projects, 
                                  error=f"Error creating issue: {str(e)}")
    
    return render_template('create_issue.html', projects=projects)


@app.route('/issue/<issue_key>')
def issue_detail(issue_key):
    """显示指定 issue 的详细信息"""
    jira = get_jira_instance()
    if not jira:
        return redirect(url_for('index'))
    
    try:
        issue = jira.issue(issue_key)
        transitions = jira.transitions(issue_key)
        return render_template('issue_detail.html', 
                              issue=issue,
                              transitions=transitions,
                              issue_key=issue_key)
    
    except JIRAError as e:
        return render_template('issue_detail.html', 
                              error=f"Error fetching issue: {str(e)}")
    except Exception as e:
        return render_template('issue_detail.html', 
                              error=f"Connection error: {str(e)}")


@app.route('/transition-issue/<issue_key>', methods=['POST'])
def transition_issue(issue_key):
    """处理 issue 状态转换"""
    jira = get_jira_instance()
    if not jira:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    
    transition_id = request.json.get('transition_id')
    if not transition_id:
        return jsonify({"status": "error", "message": "Transition ID required"}), 400
    
    try:
        jira.transition_issue(issue_key, transition_id)
        issue = jira.issue(issue_key)
        new_transitions = jira.transitions(issue_key)
        transitions_data = [{"id": t.id, "name": t.name} for t in new_transitions]
        
        return jsonify({
            "status": "success", 
            "message": "Transition successful",
            "current_status": issue.fields.status.name,
            "transitions": transitions_data
        })
    
    except JIRAError as e:
        return jsonify({
            "status": "error", 
            "message": f"Transition failed: {str(e)}"
        }), e.status_code
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/get-latest-issue-status/<issue_key>')
def get_latest_issue_status(issue_key):
    """实时获取issue最新状态"""
    jira = get_jira_instance()
    if not jira:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    
    try:
        issue = jira.issue(issue_key)
        transitions = jira.transitions(issue_key)
        
        transitions_data = [{"id": t.id, "name": t.name} for t in transitions]
        
        return jsonify({
            "status": "success",
            "current_status": issue.fields.status.name,
            "transitions": transitions_data,
            "summary": issue.fields.summary,
            "updated": issue.fields.updated[:16]
        })
    
    except JIRAError as e:
        return jsonify({"status": "error", "message": str(e)}), e.status_code
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/get-issue-types/<project_id>')
def get_issue_types(project_id):
    """获取指定项目可用的Issue类型"""
    jira = get_jira_instance()
    if not jira:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    
    try:
        issue_types = jira.issue_types()
        project_issue_types = []
        
        for issue_type in issue_types:
            if hasattr(issue_type, 'scope') and issue_type.scope and issue_type.scope['project'] == project_id:
                project_issue_types.append({
                    'id': issue_type.id,
                    'name': issue_type.name
                })
        
        project_issue_types.sort(key=lambda x: x['name'])
        return jsonify({"status": "success", "issue_types": project_issue_types})
    
    except JIRAError as e:
        return jsonify({"status": "error", "message": str(e)}), e.status_code
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/onboarding-apps')
def onboarding_apps():
    """Onboarding Apps功能模块"""
    jira = get_jira_instance()
    if not jira:
        return redirect(url_for('index'))
    
    architecture_issues = []
    error = None
    
    try:
        # 搜索所有issue类型为"Architecture Decision"的issue
        jql = 'issuetype = "Architecture Decision"'
        issues = jira.search_issues(jql, maxResults=False)
        
        for issue in issues:
            # 获取状态变更历史
            changelog = jira.changelog(issue)
            status_history = []
            
            for history in changelog.histories:
                for item in history.items:
                    if item.field == 'status':
                        status_history.append({
                            'from_status': item.fromString,
                            'to_status': item.toString,
                            'author': history.author.displayName,
                            'created': history.created
                        })
            
            # 按时间排序
            status_history.sort(key=lambda x: x['created'])
            
            architecture_issues.append({
                'key': issue.key,
                'summary': issue.fields.summary,
                'project': issue.fields.project.name,
                'status': issue.fields.status.name,
                'created': issue.fields.created,
                'updated': issue.fields.updated,
                'reporter': issue.fields.reporter.displayName if issue.fields.reporter else 'Unknown',
                'status_history': status_history
            })
            
    except JIRAError as e:
        error = f"Error fetching architecture decisions: {str(e)}"
    except Exception as e:
        error = f"Connection error: {str(e)}"
    
    return render_template('onboarding_apps.html', 
                          issues=architecture_issues, 
                          error=error)


if __name__ == '__main__':
    app.run(debug=True)
