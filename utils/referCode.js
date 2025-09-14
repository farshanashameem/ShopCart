const base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function encodeBase62(num) {
  let str = "";
  while (num > 0) {
    str = base62[num % 62] + str;
    num = Math.floor(num / 62);
  }
  return str;
}

function generateReferralCode(objectId) {
  const intVal = parseInt(objectId.toString().slice(-8), 16); // take last 8 chars as hex
  return "REF" + encodeBase62(intVal);
}

module.exports=generateReferralCode;