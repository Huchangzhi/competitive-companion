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

      const input = inputEl ? this.getPreTrimmedText(inputEl) : '';
      const output = outputEl ? this.getPreTrimmedText(outputEl) : '';

      task.addTest(input, output);
      sampleIndex++;
    }

    return task.build();
  }

  private getPreTrimmedText(element: Element): string {
    // Find all pre elements inside the sample input/output div
    const pres = element.querySelectorAll('pre');
    if (pres.length > 0) {
      // For elements with pre tags, extract text from them
      return [...pres].map(pre => pre.textContent.trim()).join('\n');
    } else {
      // Fallback to direct text content
      return element.textContent.trim();
    }
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
