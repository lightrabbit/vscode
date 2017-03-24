/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import { IMatch, IFilter } from 'vs/base/common/filters';
import pinyinlite = require('pinyinlite');

function permutation(data: string[][]): string[][] {
	var outstr: string[][] = [];
	var str: string[] = [];
	function s(n_row: number) {
		if (n_row >= data.length) {
			outstr.push(str.concat());
			return;
		}
		for (var i = 0; i < data[n_row].length; i++) {
			str.push(data[n_row][i]);
			s(n_row + 1);
			str.pop();
		}
	}
	s(0);
	return outstr;
}

/**
 *
 * @param orgstr 原始中文字符串
 * @param pinyinList 拼音字符串数组
 * @param sep 分隔符
 * @param upperFirstChar 是否首字母大写
 */
function combinePinyin(orgstr: string, pinyinList: string[], sep: string = '', upperFirstChar: boolean = true): [string, number[]] {
	var out = '';
	var positionMap: number[] = [];
	for (var i = 0; i < pinyinList.length; i++) {
		var c = pinyinList[i];
		if (c !== orgstr[i]) { //处理转换后的中文字符串
			var py = c;
			if (upperFirstChar) {
				py = c.charAt(0).toUpperCase() + c.substr(1);
			}
			//TODO: 前后补分隔符
			if (i > 0 && orgstr[i - 1] === pinyinList[i - 1]) {//前面是英文的话则向前补分隔符
				py = sep + py;
			}
			if (i < pinyinList.length - 1) {//如果不是最后一个，则向后补分隔符
				py = py + sep;
			}
			out += py;
			for (var j = 0; j < py.length; j++) {
				positionMap.push(i);
			}
		} else { //处理英文字符串
			out += c;
			positionMap.push(i);
		}
	}
	return [out, positionMap];
}

/**
 * 附加上将汉字字符转换成拼音并且进行或运算匹配的过滤器。
 * @param sep 根据需要来在拼音之间增加分隔符
 * @param filter 过滤器们
 * @returns 一个用或运算合并的过滤器集合。
 * 返回其中 *第一个* 匹配出结果的过滤器所返回的结果。
 */
export function or(sep?: string, ...filter: IFilter[]): IFilter {
	return function (word, wordToMatchAgainst): IMatch[] {
		for (let i = 0, len = filter.length; i < len; i++) {
			//解析成拼音后进行匹配
			let pinyinMap = pinyinlite(wordToMatchAgainst, { keepUnrecognized: true });
			let pinyinToMatchAgainstList = permutation(pinyinMap);
			for (let j = 0; j < pinyinToMatchAgainstList.length; j++) {
				let pinyin = pinyinToMatchAgainstList[j];
				var [combinedPinyin, positionMap] = combinePinyin(wordToMatchAgainst, pinyin, sep);
				let match = filter[i](word, combinedPinyin);
				if (match) {
					return match.map(v => ({
						start: positionMap[v.start],
						end: positionMap[v.end - 1] + 1
					}));
				}
			}

			//匹配原始内容
			let match = filter[i](word, wordToMatchAgainst);
			if (match) {
				return match;
			}
		}
		return null;
	};
}