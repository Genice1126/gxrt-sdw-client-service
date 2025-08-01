const process = require('child_process');
const Helper = require('../helper');
const CONFIG = require('../../config');

exports.addIpsec = async (data) => {
  let configText = `
    config setup
      uniqueids=yes

    conn ${data.ipsec_name}
      keyexchange=${data.ipsec_ike.version}  #IKE版本
      aggressive=${data.ipsec_ike.mode}   #模式 主模式
      type=tunnel   #隧道模式，默认参数
      left=${data.ipsec_basic.sour_terminal_gateway}  #本端IP地址
      right=${data.ipsec_basic.dest_terminal_gateway}   #对端IP地址
      leftid=${data.ipsec_ike.sour_id}  #本端ID信息
      rightid=${data.ipsec_ike.dest_id}  #对端ID信息
      leftsubnet=${data.ipsec_basic.sour_subnet}  #本端子网范围
      rightsubnet=${data.ipsec_basic.dest_subnet}  #对端子网范围
      ike=${data.ipsec_ike.encry_algorithm}-${data.ipsec_ike.random_func}-${data.ipsec_ike.dh_group}!  #加密算法-认证函数-DH组
      esp=${data.ipsec_ike.encry_algorithm}-${data.ipsec_ike.auth_algorithm}!  #加密算法-认证算法
      ikelifetime=${data.ipsec_ike.survival_time}   #第一阶段ike生存时间
      dpdaction=restart         # 对等体死亡时尝试重启连接
      dpddelay=${data.ipsec_ike.dpd_frequency}s             # 每30秒发送一次DPD探测
      dpdtimeout=120s          # 超过120秒无响应则认为对等体死亡
      auto=add                 #手动的方式启动，默认参数
      authby=psk            #密钥认证，默认参数
      fragmentation=yes          # 启用分片支持
      forceencaps=yes            # 强制封装UDP包头以穿越NAT
      lifetime=1h                 # 第二阶段（SA）硬生存时间为1小时
  `
  
  try {
    const ipsecDir = path.resolve(__dirname, CONFIG.IPSEC_PATH_TMP); // 里面是多个配置文件
    const outputPath = path.resolve(__dirname, CONFIG.IPSEC_PATH); // 最终合并后的文件

    //写入该配置文件（单独）
    const singleConfPath = path.resolve(ipsecDir, `${data.ipsec_name}.conf`);
    await fs.promises.writeFile(singleConfPath, configText.trim(), 'utf-8');

    console.log(`写入配置文件成功：${singleConfPath}`);

    //读取该目录所有 .conf 文件并合并
    const files = await fs.promises.readdir(ipsecDir);
    const confFiles = files.filter(f => f.endsWith('.conf'));

    let mergedContent = '';

    for (const file of confFiles) {
      const content = await fs.promises.readFile(path.join(ipsecDir, file), 'utf-8');
      mergedContent += `\n# === ${file} ===\n` + content + '\n';
    }

    //写入合并后的配置文件
    await fs.promises.writeFile(outputPath, mergedContent.trim(), 'utf-8');
    console.log(`合并文件生成成功：${outputPath}`);

    await new Promise((resolve, reject) => {
      exec('', (err, stdout, stderr) => {
        if (err) {
          console.error(`命令执行失败: ${err.message}`);
          return reject(err);
        }
        console.log(`命令执行成功:\n${stdout}`);
        resolve(stdout);
      });
    });

    return true;

  } catch (err) {
    console.error('写入/合并失败:', err);
    throw err;
  }
}

exports.deleteIpsec = async(data) => {
  try {
    const ipsecDir = path.resolve(__dirname, CONFIG.IPSEC_PATH_TMP);
    const fileDest = path.resolve(__dirname, ipsecDir, data.ipsec_name);
    if (fs.existsSync(fileDest)) {
      fs.unlinkSync(fileDest);
    }
    const files = await fs.promises.readdir(ipsecDir);
    const confFiles = files.filter(f => f.endsWith('.conf'));
    let mergedContent = '';

    for (const file of confFiles) {
      const content = await fs.promises.readFile(path.join(ipsecDir, file), 'utf-8');
      mergedContent += `\n# === ${file} ===\n` + content + '\n';
    }

    //写入合并后的配置文件
    await fs.promises.writeFile(outputPath, mergedContent.trim(), 'utf-8');
    console.log(`合并文件生成成功：${outputPath}`);

    await new Promise((resolve, reject) => {
      exec('', (err, stdout, stderr) => {
        if (err) {
          console.error(`命令执行失败: ${err.message}`);
          return reject(err);
        }
        console.log(`命令执行成功:\n${stdout}`);
        resolve(stdout);
      });
    });

    return true;

  } catch(e) {
    console.error('写入/合并失败:', err);
    throw err;
  }
}