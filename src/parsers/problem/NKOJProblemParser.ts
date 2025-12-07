import { Sendable } from '../../models/Sendable';
import { TaskBuilder } from '../../models/TaskBuilder';
import { htmlToElement } from '../../utils/dom';
import { Parser } from '../Parser';

export class NKOJProblemParser extends Parser {
  public getMatchPatterns(): string[] {
    return [
      'http://oi.nks.edu.cn:19360/zh/Problem/Details*',
      'https://oi.nks.edu.cn:19360/zh/Problem/Details*',
      'http://oi.nks.edu.cn:19360/en/Problem/Details*',
      'https://oi.nks.edu.cn:19360/en/Problem/Details*',
    ];
  }

  public async parse(url: string, html: string): Promise<Sendable> {
    const elem = htmlToElement(html);
    const task = new TaskBuilder('NKOJ').setUrl(url);

    // Extract problem title
    const titleElement = elem.querySelector('#TdMainTitle');
    if (titleElement) {
      // Remove the problem ID label (like "B" or "A" at the beginning)
      const clone = titleElement.cloneNode(true) as HTMLElement;
      const label = clone.querySelector('.label');
      if (label) {
        label.remove();
      }
      task.setName(clone.textContent.trim());
    }

    // Extract time and memory limits
    const limitsText = elem.querySelector('#TblLimits')?.textContent || '';
    const timeMatch = limitsText.match(/时间限制\s*:\s*(\S+)/);
    const memoryMatch = limitsText.match(/空间限制\s*:\s*(\S+)/);

    if (timeMatch) {
      const timeLimit = this.parseTimeLimit(timeMatch[1]);
      task.setTimeLimit(timeLimit);
    }

    if (memoryMatch) {
      const memoryLimit = this.parseMemoryLimit(memoryMatch[1]);
      task.setMemoryLimit(memoryLimit);
    }

    // Extract samples
    let sampleIndex = 0;
    while (true) {
      const inputEl = elem.querySelector(`#SampleInput-${sampleIndex}`);
      const outputEl = elem.querySelector(`#SampleOutput-${sampleIndex}`);

      if (!inputEl && !outputEl) break;

      const input = inputEl ? this.extractSampleText(inputEl) : '';
      const output = outputEl ? this.extractSampleText(outputEl) : '';

      task.addTest(input, output);
      sampleIndex++;
    }

    return task.build();
  }

  private extractSampleText(element: Element): string {
    // 方法1：尝试获取 pre 标签内的文本（如果有的话）
    const preElement = element.querySelector('pre');
    if (preElement) {
      const text = preElement.textContent || '';
      return this.normalizeText(text);
    }

    // 方法2：如果是 <p> 标签包含 <br> 和 &nbsp; 的格式
    const pElement = element.querySelector('p');
    if (pElement) {
      // 创建一个临时 div 来处理 HTML 内容
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = pElement.innerHTML;
      
      // 将 <br> 标签转换为换行符
      const brs = tempDiv.querySelectorAll('br');
      brs.forEach(br => {
        br.replaceWith('\n');
      });
      
      // 获取文本并规范化
      let text = tempDiv.textContent || '';
      
      // 替换 HTML 实体
      text = text.replace(/&nbsp;/g, ' ');
      text = text.replace(/&lt;/g, '<');
      text = text.replace(/&gt;/g, '>');
      text = text.replace(/&amp;/g, '&');
      
      return this.normalizeText(text);
    }

    // 方法3：回退到普通文本提取
    let text = element.textContent || '';
    text = text.replace(/&nbsp;/g, ' ');
    return this.normalizeText(text);
  }

  private normalizeText(text: string): string {
    // 替换连续的空白字符为单个空格（除了换行符）
    text = text.replace(/[ \t\r\f\v]+/g, ' ');
    
    // 规范化换行符
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 去除首尾空白
    text = text.trim();
    
    return text;
  }

  private parseTimeLimit(timeStr: string): number {
    // Convert time limit to milliseconds
    const num = parseFloat(timeStr);
    if (timeStr.includes('ms')) {
      return num;
    } else {
      // Assume seconds if no unit specified or 's' in the string
      return num * 1000;
    }
  }

  private parseMemoryLimit(memoryStr: string): number {
    // Convert memory limit to MB
    const num = parseInt(memoryStr, 10);
    if (memoryStr.includes('GB') || memoryStr.includes('g')) {
      return num * 1024;
    } else {
      // Assume MB if no unit specified or 'MB' in the string
      return num;
    }
  }
}