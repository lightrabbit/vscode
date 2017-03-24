declare module 'pinyinlite' {
	function getPinyin(str: string, options?: {
		keepUnrecognized?: boolean
	}): string[][];
	export = getPinyin;
}