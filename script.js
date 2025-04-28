function binaryStringToBoolArray(str) {
    if (str.length !== 80 || !/^[01]+$/.test(str)) {
      throw new Error("Key/IV must be 80 bits (0 or 1 only).");
    }
    return str.split('').map(bit => bit === '1');
}

function generateKeyIV() {
    let key = '';
    let iv = '';
    for (let i = 0; i < 80; i++) {
        key += Math.floor(Math.random() * 2); // Random bit: 0 or 1
        iv += Math.floor(Math.random() * 2);
    }

    // Set values in the input fields
    document.getElementById('key').value = key;
    document.getElementById('iv').value = iv;
}

class Trivium {
    constructor(keyBits, ivBits) {
      this.state = new Array(288).fill(false);
  
      for (let i = 0; i < 80; i++) {
        this.state[i] = keyBits[i];
      }
  
      for (let i = 0; i < 80; i++) {
        this.state[i + 93] = ivBits[i];
      }
  
      this.state[285] = true;
      this.state[286] = true;
      this.state[287] = true;
  
      for (let i = 0; i < 4 * 288; i++) {
        this.clock();
      }
    }
  
    clock() {
      let t1 = this.state[65] ^ (this.state[90] && this.state[91]) ^ this.state[92] ^ this.state[170];
      let t2 = this.state[161] ^ (this.state[174] && this.state[175]) ^ this.state[176] ^ this.state[263];
      let t3 = this.state[242] ^ (this.state[285] && this.state[286]) ^ this.state[287] ^ this.state[68];
  
      this.state = [t3, ...this.state.slice(0, 92),
                    t1, ...this.state.slice(93, 176),
                    t2, ...this.state.slice(177, 287)];
    }
  
    getNextBit() {
      let z = this.state[65] ^ this.state[92] ^
              this.state[161] ^ this.state[176] ^
              this.state[242] ^ this.state[287];
      this.clock();
      return z ? 1 : 0;
    }
  
    getKeyStream(length) {
      const stream = [];
      for (let i = 0; i < length * 8; i++) {
        stream.push(this.getNextBit());
      }
      return stream;
    }
  
    static xorBytes(byteArr, keystreamBits) {
      const output = [];
      for (let i = 0; i < byteArr.length; i++) {
        let byte = 0;
        for (let j = 0; j < 8; j++) {
          const bit = (byteArr[i] >> (7 - j)) & 1;
          const xor = bit ^ keystreamBits[i * 8 + j];
          byte |= xor << (7 - j);
        }
        output.push(byte);
      }
      return output;
    }
}
  
function encrypt() {
    try {
      const keyStr = document.getElementById("key").value.trim();
      const ivStr = document.getElementById("iv").value.trim();
      const plaintext = document.getElementById("plaintext").value;
  
      const key = binaryStringToBoolArray(keyStr);
      const iv = binaryStringToBoolArray(ivStr);
      const trivium = new Trivium(key, iv);
  
      const encoder = new TextEncoder();
      const plainBytes = Array.from(encoder.encode(plaintext));
  
      const keystream = trivium.getKeyStream(plainBytes.length);
      const cipherBytes = Trivium.xorBytes(plainBytes, keystream);
  
      const hex = cipherBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(" ");
      document.getElementById("ciphertext").value = hex;
  
    } catch (e) {
      alert(e.message);
    }
}
  
function decrypt() {
    try {
      const keyStr = document.getElementById("key").value.trim();
      const ivStr = document.getElementById("iv").value.trim();
      const cipherHex = document.getElementById("ciphertext").value.trim();
  
      const key = binaryStringToBoolArray(keyStr);
      const iv = binaryStringToBoolArray(ivStr);
      const trivium = new Trivium(key, iv);
  
      const cipherBytes = cipherHex.split(" ").map(hex => parseInt(hex, 16));
      const keystream = trivium.getKeyStream(cipherBytes.length);
      const plainBytes = Trivium.xorBytes(cipherBytes, keystream);
  
      const decoder = new TextDecoder();
      document.getElementById("decrypted").value = decoder.decode(new Uint8Array(plainBytes));
  
    } catch (e) {
      alert(e.message);
    }
}
