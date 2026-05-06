针对你的进阶需求，核心方案调整为：放弃截图，改用 
"jsPDF" 原生文本 API 绘制矢量 PDF，配合 CSS 分页媒体 实现 A4 预览。这是实现“无失真、无空白、居中排版”的唯一专业解法。

一、 关键技术调整

1. 矢量 PDF（防失真）：不再使用 
"html2canvas"。改为使用 
"pdf.text()" 逐字绘制。虽然代码稍复杂，但生成的是无限清晰的矢量线条，打印绝不失真。
2. A4 分页预览：利用 
"@page" 规则和 
"page-break" 属性，让网页预览像 Word 一样按 A4 纸切割。
3. 自动换行与居中：通过计算字符串宽度（
"getTextWidth"），动态调整 X 轴坐标，实现视觉上的绝对居中。

二、 落地代码方案

1. 预览页面（HTML + CSS）

负责在屏幕上模拟 A4 纸，并处理换行和居中。

<style>
  /* 强制 A4 尺寸与分页 */
  body { margin: 0; background: #eee; font-family: "SimSun", "Microsoft YaHei"; }
  .page { 
    width: 210mm; height: 297mm; /* A4 尺寸 */
    margin: 10mm auto; padding: 0; /* 移除内边距实现无空白 */
    background: white; box-shadow: 0 0 10px rgba(0,0,0,.1);
    display: flex; flex-direction: column; align-items: center; /* 垂直水平居中 */
    page-break-after: always; 
  }
  .line { font-size: 24px; line-height: 1.8; text-align: center; }
  rt { font-size: 12px; color: #555; }
</style>

<div id="preview"></div>
<script>
// 复用你的 JSON 数据
const data = {"title":"白龙马", "content": [...]}; 
let html = '';
data.content.forEach(line => {
  html += '<div class="page"><div class="line">';
  line.forEach(([char, py]) => {
    html += `<ruby>${char}<rt>${py}</rt></ruby>`;
  });
  html += '</div></div>';
});
document.getElementById('preview').innerHTML = html;
</script>

2. 矢量 PDF 导出（JavaScript）

使用 
"jsPDF" 手动计算位置，确保每一行都在页面中间。

<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script>
function exportVectorPdf() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210, pageH = 297;
  const fontSize = 14; // 调整这里改变字体大小
  const lineHeight = 15; // 行间距
  let cursorY = 40; // 起始Y坐标

  pdf.setFont("SimSun"); // 设置中文字体（需确保环境支持）
  pdf.setFontSize(fontSize);

  data.content.forEach((line, index) => {
    // 计算该行总宽度以实现居中
    let totalWidth = 0;
    line.forEach(([char]) => totalWidth += pdf.getTextWidth(char));
    
    let cursorX = (pageW - totalWidth) / 2; // 居中计算

    // 分页截断（智能）
    if (cursorY > pageH - 30) {
      pdf.addPage();
      cursorY = 30;
    }

    // 绘制拼音和汉字
    line.forEach(([char, py]) => {
      pdf.setFontSize(fontSize - 4);
      pdf.text(py, cursorX, cursorY - 5); // 拼音在上
      pdf.setFontSize(fontSize);
      pdf.text(char, cursorX, cursorY + 5); // 汉字在下
      cursorX += pdf.getTextWidth(char);
    });
    cursorY += lineHeight;
  });

  pdf.save('vector-output.pdf');
}
</script>

三、 避坑指南

需求 解决方案
打印不失真 必须使用 
"pdf.text()" 矢量绘制，禁用 
"html2canvas"。
无四周空白 移除 CSS 的 
"padding"，JS 中计算 X/Y 坐标从边缘开始。
一行放不下 代码中已加入 
"if (cursorY > pageH)" 判断，自动翻页。
字体大小可调 修改 
"fontSize" 变量即可全局生效。

四、 注意事项

* 字体嵌入：
"jsPDF" 默认不支持中文字体。如果导出后文字消失，你需要加载一个中文字体文件（如 
"simsun.ttf"）并注册到 
"jsPDF"。
* 拼音对齐：上述代码使用了简单的上下堆叠（拼音在上，字在下），这是为了避免 
"<ruby>" 标签在矢量 PDF 中难以控制的偏移问题，效果更稳定。

需要我帮你补充中文字体嵌入的代码部分吗？这样可以确保任何电脑打开 PDF 都不会乱码。

json :

{"title": "白龙马","type": "歌曲","content": [[["白","bái"],["龙","lóng"],["马","mǎ"]],[["白","bái"],["龙","lóng"],["马","mǎ"],["蹄","tí"],["儿","ér"],["朝","cháo"],["西","xī"]],[["驮","tuó"],["着","zhe"],["唐","táng"],["三","sān"],["藏","zàng"],["跟","gēn"],["着","zhe"],["仨","sā"],["徒","tú"],["弟","dì"]],[["西","xī"],["天","tiān"],["取","qǔ"],["经","jīng"],["上","shàng"],["大","dà"],["路","lù"]],[["一","yī"],["走","zǒu"],["就","jiù"],["是","shì"],["几","jǐ"],["万","wàn"],["里","lǐ"]],[["什","shén"],["么","me"],["妖","yāo"],["魔","mó"],["鬼","guǐ"],["怪","guài"],["什","shén"],["么","me"],["美","měi"],["女","nǚ"],["画","huà"],["皮","pí"]],[["什","shén"],["么","me"],["刀","dāo"],["山","shān"],["火","huǒ"],["海","hǎi"],["什","shén"],["么","me"],["陷","xiàn"],["阱","jǐng"],["诡","guǐ"],["计","jì"]],[["什","shén"],["么","me"],["妖","yāo"],["魔","mó"],["鬼","guǐ"],["怪","guài"],["什","shén"],["么","me"],["美","měi"],["女","nǚ"],["画","huà"],["皮","pí"]],[["什","shén"],["么","me"],["刀","dāo"],["山","shān"],["火","huǒ"],["海","hǎi"],["什","shén"],["么","me"],["陷","xiàn"],["阱","jǐng"],["诡","guǐ"],["计","jì"]],[["都","dōu"],["挡","dǎng"],["不","bù"],["住","zhù"],["火","huǒ"],["眼","yǎn"],["金","jīn"],["睛","jīng"],["的","de"],["如","rú"],["意","yì"],["棒","bàng"]],[["护","hù"],["送","sòng"],["师","shī"],["徒","tú"],["朝","cháo"],["西","xī"],["去","qù"]],[["白","bái"],["龙","lóng"],["马","mǎ"],["脖","bó"],["铃","líng"],["儿","ér"],["急","jí"]],[["颠","diān"],["簸","bǒ"],["唐","táng"],["玄","xuán"],["奘","zàng"],["小","xiǎo"],["跑","pǎo"],["仨","sā"],["兄","xiōng"],["弟","dì"]],[["西","xī"],["天","tiān"],["取","qǔ"],["经","jīng"],["不","bù"],["容","róng"],["易","yì"]],[["容","róng"],["易","yì"],["干","gàn"],["不","bù"],["成","chéng"],["大","dà"],["业","yè"],["绩","jì"]],[["什","shén"],["么","me"],["魔","mó"],["法","fǎ"],["狠","hěn"],["毒","dú"],["自","zì"],["有","yǒu"],["招","zhāo"],["数","shù"],["神","shén"],["奇","qí"]],[["八","bā"],["十","shí"],["一","yī"],["难","nàn"],["拦","lán"],["路","lù"],["七","qī"],["十","shí"],["二","èr"],["变","biàn"],["制","zhì"],["敌","dí"]],[["什","shén"],["么","me"],["魔","mó"],["法","fǎ"],["狠","hěn"],["毒","dú"],["自","zì"],["有","yǒu"],["招","zhāo"],["数","shù"],["神","shén"],["奇","qí"]],[["八","bā"],["十","shí"],["一","yī"],["难","nàn"],["拦","lán"],["路","lù"],["七","qī"],["十","shí"],["二","èr"],["变","biàn"],["制","zhì"],["敌","dí"]],[["师","shī"],["徒","tú"],["四","sì"],["个","gè"],["斩","zhǎn"],["妖","yāo"],["斗","dòu"],["魔","mó"],["同","tóng"],["心","xīn"],["合","hé"],["力","lì"]],[["邪","xié"],["恶","è"],["打","dǎ"],["不","bù"],["过","guò"],["正","zhèng"],["义","yì"]]]}