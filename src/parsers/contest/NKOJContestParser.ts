import { Task } from '../../models/Task';
import { htmlToElement } from '../../utils/dom';
import { ContestParser } from '../ContestParser';

export class NKOJContestParser extends ContestParser {
  public getMatchPatterns(): string[] {
    return [
      'http://oi.nks.edu.cn:19360/zh/Problem/Lists?cid=*',
      'https://oi.nks.edu.cn:19360/zh/Problem/Lists?cid=*',
      'http://oi.nks.edu.cn:19360/en/Problem/Lists?cid=*',
      'https://oi.nks.edu.cn:19360/en/Problem/Lists?cid=*',
      'http://oi.nks.edu.cn:19360/zh/Contest/Details?cid=*',
      'https://oi.nks.edu.cn:19360/zh/Contest/Details?cid=*',
      'http://oi.nks.edu.cn:19360/en/Contest/Details?cid=*',
      'https://oi.nks.edu.cn:19360/en/Contest/Details?cid=*',
      'http://oi.nks.edu.cn:19360/zh/Contest/Problems?cid=*',
      'https://oi.nks.edu.cn:19360/zh/Contest/Problems?cid=*',
      'http://oi.nks.edu.cn:19360/en/Contest/Problems?cid=*',
      'https://oi.nks.edu.cn:19360/en/Contest/Problems?cid=*',
    ];
  }

  public async parse(url: string, html: string): Promise<Task[]> {
    const elem = htmlToElement(html);
    const tasks: Task[] = [];

    // Find all problem links in the contest
    const problemLinks = elem.querySelectorAll('a[href*="/Problem/Details"], a[href*="tid="]');
    
    for (const link of Array.from(problemLinks)) {
      const href = link.getAttribute('href');
      if (href) {
        const fullUrl = new URL(href, url).href;
        if (fullUrl.includes('/Problem/Details')) {
          tasks.push({ url: fullUrl, getMatchPatterns: () => [fullUrl] });
        }
      }
    }

    return tasks;
  }
}