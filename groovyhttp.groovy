import groovy.json.JsonSlurper
import java.net.URLEncoder

// 接口地址
def apiUrl = "http://localhost:8080/api/parse-containers"

// 要传递的文档内容
def docContent = '''Name: test-pod
Namespace: default
Containers:
app:
  Container ID: containerd://123
  Limits:
    cpu: 1
    memory: 256M'''

try {
    // 编码文档内容为URL安全格式
    def encodedDoc = URLEncoder.encode(docContent, "UTF-8")
    
    // 创建完整URL
    def url = new URL("${apiUrl}?doc=${encodedDoc}")
    
    // 发送GET请求
    def connection = url.openConnection()
    connection.requestMethod = "GET"
    
    // 读取并打印完整JSON响应
    if (connection.responseCode == 200) {
        def jsonResponse = new JsonSlurper().parse(connection.inputStream)
        println "接口返回的JSON内容："
        println new groovy.json.JsonBuilder(jsonResponse).toPrettyString() // 格式化打印
    } else {
        // 打印错误信息
        def error = new JsonSlurper().parse(connection.errorStream)
        println "错误 (${connection.responseCode}): ${error}"
    }
} catch (Exception e) {
    println "请求失败: ${e.message}"
}
