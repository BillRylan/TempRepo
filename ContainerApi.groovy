import static spark.Spark.*
import com.google.gson.Gson

// 数据模型：容器信息
class Container {
    String name
    String id
    Map limits = [:]
    Map requests = [:]
}

// 数据模型：返回结果
class PodResult {
    String name
    String namespace
    List<Container> containers = []
}

// 容器信息解析服务
class ContainerParser {
    PodResult parse(String doc) {
        def result = new PodResult()
        
        // 提取 Name 和 Namespace
        result.name = (doc =~ /(?m)^Name:\s+(\S+)/)[0][1]
        result.namespace = (doc =~ /(?m)^Namespace:\s+(\S+)/)[0][1]
        
        // 提取所有容器（Init Containers 和 Containers）
        def containerSections = (doc =~ /(?sm)(Init Containers:|Containers:)(.*?)(?=Containers:|Conditions:|$)/)
        
        containerSections.each { full, type, content ->
            def containerPattern = ~/(?m)^(\S+):\n\s+Container ID:\s+(\S+)\n\s+Restart Count:.*?\n\s+Limits:\n\s+cpu:\s+(\S+)\n\s+memory:\s+(\S+)\n\s+Requests:\n\s+cpu:\s+(\S+)\n\s+memory:\s+(\S+)/
            def matcher = content =~ containerPattern
            
            matcher.each { match, cName, cId, lCpu, lMem, rCpu, rMem ->
                def container = new Container(
                    name: cName,
                    id: cId,
                    limits: [cpu: unifyCpu(lCpu), memory: unifyMemory(lMem)],
                    requests: [cpu: unifyCpu(rCpu), memory: unifyMemory(rMem)]
                )
                result.containers << container
            }
        }
        
        return result
    }
    
    // 统一 CPU 单位为 m
    private String unifyCpu(String cpu) {
        if (cpu.endsWith('m')) return cpu
        try {
            return "${(cpu.toDouble() * 1000).toInteger()}m"
        } catch (e) {
            return cpu
        }
    }
    
    // 统一内存单位为 Mi
    private String unifyMemory(String memory) {
        if (memory.endsWith('Mi')) return memory
        def units = [M:1, Gi:1024, G:1024, Ki:0.0009765625, K:0.0009765625]
        def m = (memory =~ /(\d+(\.\d+)?)(\D+)?/)
        if (m.matches()) {
            def val = m[0][1].toDouble()
            def unit = m[0][3] ?: 'M'
            return "${(val * units[unit]).toInteger()}Mi"
        }
        return memory
    }
}

// 启动 HTTP 服务并暴露接口
class ContainerApi {
    static void main(String[] args) {
        // 配置端口
        port(8080)
        
        // 允许跨域（方便前端调试）
        before { req, res ->
            res.header("Access-Control-Allow-Origin", "*")
            res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            res.header("Access-Control-Allow-Headers", "Content-Type")
        }
        
        def parser = new ContainerParser()
        def gson = new Gson()
        
        // 暴露接口：解析容器信息
        post("/api/parse-containers") { req, res ->
            res.type("application/json")
            try {
                def doc = req.body()
                def result = parser.parse(doc)
                return gson.toJson(result)
            } catch (e) {
                res.status(500)
                return gson.toJson([error: e.message])
            }
        }
        
        println "服务已启动，接口地址：http://localhost:8080/api/parse-containers"
    }
}
