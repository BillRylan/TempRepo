import groovy.json.JsonBuilder

// 输入文档内容
def doc = '''Name:         data-service-redis-cluster-0 Namespace:    gpa-app-dev Priority:     0 Controlled By:  StatefulSet/data-service-redis-cluster Init Containers: vault-agent-init:   Container ID:  containerd://5616b328111078f48v994b431f04be31edf68e5dEe130c4d04f87dfdfb324cf7   Restart Count:  0   Limits:     cpu:     500m     memory:  128Mi   Requests:     cpu:     250m     memory:  64Mi   Mounts:     /home/vault from home-init (rw)     /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-zxhpw (ro)     /vault/secrets from vault-secrets (rw)     /vault/tls from vault-tls-secrets (ro) Containers: redis-cluster:   Container ID:  containerd://3ce84dfe30265143ecda68a632f305ed7a9b289d84202ed137b93d610e2e959d   Restart Count:  0   Limits:     cpu:     500m     memory:  512Mi   Requests:     cpu:     100m     memory:  128Mi   Mounts:     /bitnami from data (rw)     /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-zxhpw (ro)     /vault/secrets from vault-secrets (rw) vault-agent:   Container ID:  containerd://2219724029c2ef27e07753afcdb11596cd1f52f4791e658877878bcba03c   Restart Count:  4   Limits:     cpu:     500m     memory:  128Mi   Requests:     cpu:     250m     memory:  64Mi   Mounts:     /home/vault from home-sidecar (rw)     /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-zxhpw (ro)     /vault/secrets from vault-secrets (rw)     /vault/tls from vault-tls-secrets (ro) Conditions:   Type              Status   Initialized       True   Ready             True   ContainersReady   True   PodScheduled      True Events:             <none>'''

// 提取最外层的Name和Namespace信息
def name = (doc =~ /Name:\s+(\S+)/)[0][1]
def namespace = (doc =~ /Namespace:\s+(\S+)/)[0][1]

// 存储所有容器信息的列表
def allContainers = []

// 匹配Init Containers和Containers部分的正则表达式
def containerSectionsPattern = ~/(Init Containers:|Containers:)(.*?)(?=Containers:|Conditions:|$)/
def sectionsMatcher = doc =~ containerSectionsPattern

sectionsMatcher.each { fullMatch, sectionType, sectionContent ->
    // 匹配每个容器（优化正则表达式，适应不同空格情况）
    def containerPattern = ~/(\S+):\s+Container ID:\s+(containerd:\/\/\S+)\s+Restart Count:\s+\d+\s+Limits:\s+cpu:\s+(\S+)\s+memory:\s+(\S+)\s+Requests:\s+cpu:\s+(\S+)\s+memory:\s+(\S+)/
    def containerMatcher = sectionContent =~ containerPattern
    
    containerMatcher.each { match, name, id, limitCpu, limitMem, reqCpu, reqMem ->
        allContainers << [
            name: name,
            id: id,
            limits: [
                cpu: limitCpu,
                memory: limitMem
            ],
            requests: [
                cpu: reqCpu,
                memory: reqMem
            ]
        ]
    }
}

// 构建最终结构，包含Name、Namespace和Containers
def result = [
    Name: name,
    Namespace: namespace,
    Containers: allContainers
]

// 输出JSON格式结果
def json = new JsonBuilder(result)
println json.toPrettyString()
