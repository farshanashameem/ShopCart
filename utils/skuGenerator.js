const generateSKU=(name, colorId, size)=>{
  const namePart = name ? name.trim().substring(0, 3).toUpperCase() : 'PRD';
  const colorPart = colorId ? colorId.toString().slice(-4).toUpperCase() : 'COLR';
  const sizePart = size ? size.toUpperCase() : 'SZ';
  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `${namePart}-${colorPart}-${sizePart}-${randomPart}`;
}

module.exports=generateSKU;