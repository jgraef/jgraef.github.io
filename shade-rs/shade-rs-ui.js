let wasm;

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b)
});

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}
function __wbg_adapter_40(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3cd73ad108072cd3(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_43(arg0, arg1, arg2, arg3) {
    wasm._dyn_core__ops__function__FnMut__A_B___Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h374492cf4414d97f(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

function __wbg_adapter_48(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hbf3ce2ab9f9d2bd4(arg0, arg1);
}

function __wbg_adapter_53(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h01090e6629e66754(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_58(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hd4b64608794ccba2(arg0, arg1);
}

function __wbg_adapter_61(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h0e89cffd22f24741(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_64(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h1ae2d7bccdcec130(arg0, arg1);
}

function __wbg_adapter_67(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h6cc979673bd1cc08(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_70(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3d428a73042c9f1e(arg0, arg1, addHeapObject(arg2));
}

/**
* @param {string} id
*/
export function mount_to(id) {
    const ptr0 = passStringToWasm0(id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.mount_to(ptr0, len0);
}

function getCachedStringFromWasm0(ptr, len) {
    if (ptr === 0) {
        return getObject(len);
    } else {
        return getStringFromWasm0(ptr, len);
    }
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

let cachedFloat32ArrayMemory0 = null;

function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedInt32ArrayMemory0 = null;

function getInt32ArrayMemory0() {
    if (cachedInt32ArrayMemory0 === null || cachedInt32ArrayMemory0.byteLength === 0) {
        cachedInt32ArrayMemory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32ArrayMemory0;
}

function getArrayI32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}
function __wbg_adapter_1070(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h86aada93e1801a8d(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

const IntoUnderlyingByteSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingbytesource_free(ptr >>> 0, 1));
/**
*/
export class IntoUnderlyingByteSource {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingByteSourceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingbytesource_free(ptr, 0);
    }
    /**
    * @returns {string}
    */
    get type() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.intounderlyingbytesource_type(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getCachedStringFromWasm0(r0, r1);
        if (r0 !== 0) { wasm.__wbindgen_free(r0, r1, 1); }
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
/**
* @returns {number}
*/
get autoAllocateChunkSize() {
    const ret = wasm.intounderlyingbytesource_autoAllocateChunkSize(this.__wbg_ptr);
    return ret >>> 0;
}
/**
* @param {ReadableByteStreamController} controller
*/
start(controller) {
    wasm.intounderlyingbytesource_start(this.__wbg_ptr, addHeapObject(controller));
}
/**
* @param {ReadableByteStreamController} controller
* @returns {Promise<any>}
*/
pull(controller) {
    const ret = wasm.intounderlyingbytesource_pull(this.__wbg_ptr, addHeapObject(controller));
    return takeObject(ret);
}
/**
*/
cancel() {
    const ptr = this.__destroy_into_raw();
    wasm.intounderlyingbytesource_cancel(ptr);
}
}

const IntoUnderlyingSinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsink_free(ptr >>> 0, 1));
/**
*/
export class IntoUnderlyingSink {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSinkFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsink_free(ptr, 0);
    }
    /**
    * @param {any} chunk
    * @returns {Promise<any>}
    */
    write(chunk) {
        const ret = wasm.intounderlyingsink_write(this.__wbg_ptr, addHeapObject(chunk));
        return takeObject(ret);
    }
    /**
    * @returns {Promise<any>}
    */
    close() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_close(ptr);
        return takeObject(ret);
    }
    /**
    * @param {any} reason
    * @returns {Promise<any>}
    */
    abort(reason) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_abort(ptr, addHeapObject(reason));
        return takeObject(ret);
    }
}

const IntoUnderlyingSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsource_free(ptr >>> 0, 1));
/**
*/
export class IntoUnderlyingSource {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSourceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsource_free(ptr, 0);
    }
    /**
    * @param {ReadableStreamDefaultController} controller
    * @returns {Promise<any>}
    */
    pull(controller) {
        const ret = wasm.intounderlyingsource_pull(this.__wbg_ptr, addHeapObject(controller));
        return takeObject(ret);
    }
    /**
    */
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingsource_cancel(ptr);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = takeObject(arg0).original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        const ret = false;
        return ret;
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_fromTextArea_9846e2133721a2bd = function(arg0, arg1) {
        const ret = CodeMirror.fromTextArea(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setValue_2c5fb724fa863570 = function(arg0, arg1) {
        getObject(arg0).setValue(getObject(arg1));
    };
    imports.wbg.__wbg_on_c2ecb35749aac95e = function(arg0, arg1, arg2, arg3) {
        var v0 = getCachedStringFromWasm0(arg1, arg2);
        getObject(arg0).on(v0, getObject(arg3));
    };
    imports.wbg.__wbg_getValue_0ce97c4ce6eb1d75 = function(arg0) {
        const ret = getObject(arg0).getValue();
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_in = function(arg0, arg1) {
        const ret = getObject(arg0) in getObject(arg1);
        return ret;
    };
    imports.wbg.__wbindgen_is_null = function(arg0) {
        const ret = getObject(arg0) === null;
        return ret;
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_is_array = function(arg0) {
        const ret = Array.isArray(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_new_abda76e883ba8a5f = function() {
        const ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stack_658279fe44541cf6 = function(arg0, arg1) {
        const ret = getObject(arg1).stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_error_f851667af71bcfc6 = function(arg0, arg1) {
        var v0 = getCachedStringFromWasm0(arg0, arg1);
    if (arg0 !== 0) { wasm.__wbindgen_free(arg0, arg1, 1); }
    console.error(v0);
};
imports.wbg.__wbg_instanceof_GpuCanvasContext_1eacd2a8c6b36ada = function(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof GPUCanvasContext;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};
imports.wbg.__wbg_instanceof_GpuDeviceLostInfo_c7232ceb822b15d6 = function(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof GPUDeviceLostInfo;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};
imports.wbg.__wbg_instanceof_GpuAdapter_ba82c448cfa55608 = function(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof GPUAdapter;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};
imports.wbg.__wbg_instanceof_GpuOutOfMemoryError_658135cd3b3f08e2 = function(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof GPUOutOfMemoryError;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};
imports.wbg.__wbg_instanceof_GpuValidationError_05482398d349fd2d = function(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof GPUValidationError;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};
imports.wbg.__wbg_gpu_7d756a02ad45027d = function(arg0) {
    const ret = getObject(arg0).gpu;
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};
imports.wbg.__wbg_size_61d4fa05868b79cd = function(arg0) {
    const ret = getObject(arg0).size;
    return ret;
};
imports.wbg.__wbg_usage_5043ac06189fbe53 = function(arg0) {
    const ret = getObject(arg0).usage;
    return ret;
};
imports.wbg.__wbg_destroy_387cb19081689594 = function(arg0) {
    getObject(arg0).destroy();
};
imports.wbg.__wbg_getMappedRange_08e71df297c66a50 = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).getMappedRange(arg1, arg2);
    return addHeapObject(ret);
};
imports.wbg.__wbg_mapAsync_98ce4986e2f6d4af = function(arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).mapAsync(arg1 >>> 0, arg2, arg3);
    return addHeapObject(ret);
};
imports.wbg.__wbg_unmap_efca7885e5daff78 = function(arg0) {
    getObject(arg0).unmap();
};
imports.wbg.__wbg_message_4bd9ef09b3092122 = function(arg0, arg1) {
    const ret = getObject(arg1).message;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};
imports.wbg.__wbg_createView_87e589e1574ba76c = function(arg0, arg1) {
    const ret = getObject(arg0).createView(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_destroy_b040948312c539a9 = function(arg0) {
    getObject(arg0).destroy();
};
imports.wbg.__wbg_dispatchWorkgroups_f0fd90dcd4a506fa = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).dispatchWorkgroups(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
};
imports.wbg.__wbg_dispatchWorkgroupsIndirect_567a84763f6a0b87 = function(arg0, arg1, arg2) {
    getObject(arg0).dispatchWorkgroupsIndirect(getObject(arg1), arg2);
};
imports.wbg.__wbg_end_bbe499813ce72830 = function(arg0) {
    getObject(arg0).end();
};
imports.wbg.__wbg_setPipeline_4d0e04e7370f0e2e = function(arg0, arg1) {
    getObject(arg0).setPipeline(getObject(arg1));
};
imports.wbg.__wbg_setBindGroup_48300d51a3d74853 = function(arg0, arg1, arg2) {
    getObject(arg0).setBindGroup(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_setBindGroup_d79f4f1d5e43c06f = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).setBindGroup(arg1 >>> 0, getObject(arg2), getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
};
imports.wbg.__wbg_getBindGroupLayout_1490d5a61f4fd56b = function(arg0, arg1) {
    const ret = getObject(arg0).getBindGroupLayout(arg1 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_messages_6833dfd0ae6a0a7c = function(arg0) {
    const ret = getObject(arg0).messages;
    return addHeapObject(ret);
};
imports.wbg.__wbg_getBindGroupLayout_0194b7a790ac805d = function(arg0, arg1) {
    const ret = getObject(arg0).getBindGroupLayout(arg1 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_has_14b751afdcf0a341 = function(arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).has(v0);
    return ret;
};
imports.wbg.__wbg_type_c3e79de7c41f03c2 = function(arg0) {
    const ret = getObject(arg0).type;
    return {"error":0,"warning":1,"info":2,}[ret] ?? 3;
};
imports.wbg.__wbg_offset_47f9a19926637c8e = function(arg0) {
    const ret = getObject(arg0).offset;
    return ret;
};
imports.wbg.__wbg_length_ff62902e8840f82f = function(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};
imports.wbg.__wbg_lineNum_06a4c70c1027df81 = function(arg0) {
    const ret = getObject(arg0).lineNum;
    return ret;
};
imports.wbg.__wbg_message_0ff806941d54e1d2 = function(arg0, arg1) {
    const ret = getObject(arg1).message;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};
imports.wbg.__wbg_features_e7f12cb6c5258238 = function(arg0) {
    const ret = getObject(arg0).features;
    return addHeapObject(ret);
};
imports.wbg.__wbg_limits_622a6ae19a037dbf = function(arg0) {
    const ret = getObject(arg0).limits;
    return addHeapObject(ret);
};
imports.wbg.__wbg_requestDevice_1c8e4f0fe8729328 = function(arg0, arg1) {
    const ret = getObject(arg0).requestDevice(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_configure_48cfbf148a9998c2 = function(arg0, arg1) {
    getObject(arg0).configure(getObject(arg1));
};
imports.wbg.__wbg_getCurrentTexture_1c8e29bec577927d = function(arg0) {
    const ret = getObject(arg0).getCurrentTexture();
    return addHeapObject(ret);
};
imports.wbg.__wbg_getPreferredCanvasFormat_d55bc32b5a6b948a = function(arg0) {
    const ret = getObject(arg0).getPreferredCanvasFormat();
    return {"r8unorm":0,"r8snorm":1,"r8uint":2,"r8sint":3,"r16uint":4,"r16sint":5,"r16float":6,"rg8unorm":7,"rg8snorm":8,"rg8uint":9,"rg8sint":10,"r32uint":11,"r32sint":12,"r32float":13,"rg16uint":14,"rg16sint":15,"rg16float":16,"rgba8unorm":17,"rgba8unorm-srgb":18,"rgba8snorm":19,"rgba8uint":20,"rgba8sint":21,"bgra8unorm":22,"bgra8unorm-srgb":23,"rgb9e5ufloat":24,"rgb10a2uint":25,"rgb10a2unorm":26,"rg11b10ufloat":27,"rg32uint":28,"rg32sint":29,"rg32float":30,"rgba16uint":31,"rgba16sint":32,"rgba16float":33,"rgba32uint":34,"rgba32sint":35,"rgba32float":36,"stencil8":37,"depth16unorm":38,"depth24plus":39,"depth24plus-stencil8":40,"depth32float":41,"depth32float-stencil8":42,"bc1-rgba-unorm":43,"bc1-rgba-unorm-srgb":44,"bc2-rgba-unorm":45,"bc2-rgba-unorm-srgb":46,"bc3-rgba-unorm":47,"bc3-rgba-unorm-srgb":48,"bc4-r-unorm":49,"bc4-r-snorm":50,"bc5-rg-unorm":51,"bc5-rg-snorm":52,"bc6h-rgb-ufloat":53,"bc6h-rgb-float":54,"bc7-rgba-unorm":55,"bc7-rgba-unorm-srgb":56,"etc2-rgb8unorm":57,"etc2-rgb8unorm-srgb":58,"etc2-rgb8a1unorm":59,"etc2-rgb8a1unorm-srgb":60,"etc2-rgba8unorm":61,"etc2-rgba8unorm-srgb":62,"eac-r11unorm":63,"eac-r11snorm":64,"eac-rg11unorm":65,"eac-rg11snorm":66,"astc-4x4-unorm":67,"astc-4x4-unorm-srgb":68,"astc-5x4-unorm":69,"astc-5x4-unorm-srgb":70,"astc-5x5-unorm":71,"astc-5x5-unorm-srgb":72,"astc-6x5-unorm":73,"astc-6x5-unorm-srgb":74,"astc-6x6-unorm":75,"astc-6x6-unorm-srgb":76,"astc-8x5-unorm":77,"astc-8x5-unorm-srgb":78,"astc-8x6-unorm":79,"astc-8x6-unorm-srgb":80,"astc-8x8-unorm":81,"astc-8x8-unorm-srgb":82,"astc-10x5-unorm":83,"astc-10x5-unorm-srgb":84,"astc-10x6-unorm":85,"astc-10x6-unorm-srgb":86,"astc-10x8-unorm":87,"astc-10x8-unorm-srgb":88,"astc-10x10-unorm":89,"astc-10x10-unorm-srgb":90,"astc-12x10-unorm":91,"astc-12x10-unorm-srgb":92,"astc-12x12-unorm":93,"astc-12x12-unorm-srgb":94,}[ret] ?? 95;
};
imports.wbg.__wbg_requestAdapter_8413757c51a35b1d = function(arg0, arg1) {
    const ret = getObject(arg0).requestAdapter(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_getCompilationInfo_adcb4d74ed54d1f9 = function(arg0) {
    const ret = getObject(arg0).getCompilationInfo();
    return addHeapObject(ret);
};
imports.wbg.__wbg_maxTextureDimension1D_71c238385d79f287 = function(arg0) {
    const ret = getObject(arg0).maxTextureDimension1D;
    return ret;
};
imports.wbg.__wbg_maxTextureDimension2D_ce910a0ea6c7213b = function(arg0) {
    const ret = getObject(arg0).maxTextureDimension2D;
    return ret;
};
imports.wbg.__wbg_maxTextureDimension3D_76032d2a97af63ac = function(arg0) {
    const ret = getObject(arg0).maxTextureDimension3D;
    return ret;
};
imports.wbg.__wbg_maxTextureArrayLayers_b561668f7e1ebacc = function(arg0) {
    const ret = getObject(arg0).maxTextureArrayLayers;
    return ret;
};
imports.wbg.__wbg_maxBindGroups_d2b688642140a1bb = function(arg0) {
    const ret = getObject(arg0).maxBindGroups;
    return ret;
};
imports.wbg.__wbg_maxBindingsPerBindGroup_a3e9e404dd893c83 = function(arg0) {
    const ret = getObject(arg0).maxBindingsPerBindGroup;
    return ret;
};
imports.wbg.__wbg_maxDynamicUniformBuffersPerPipelineLayout_98a8fbca367148bf = function(arg0) {
    const ret = getObject(arg0).maxDynamicUniformBuffersPerPipelineLayout;
    return ret;
};
imports.wbg.__wbg_maxDynamicStorageBuffersPerPipelineLayout_0dec6aea74b472ad = function(arg0) {
    const ret = getObject(arg0).maxDynamicStorageBuffersPerPipelineLayout;
    return ret;
};
imports.wbg.__wbg_maxSampledTexturesPerShaderStage_7a0712465c0a12b4 = function(arg0) {
    const ret = getObject(arg0).maxSampledTexturesPerShaderStage;
    return ret;
};
imports.wbg.__wbg_maxSamplersPerShaderStage_6716e9792fc2a833 = function(arg0) {
    const ret = getObject(arg0).maxSamplersPerShaderStage;
    return ret;
};
imports.wbg.__wbg_maxStorageBuffersPerShaderStage_640d34738978a4ff = function(arg0) {
    const ret = getObject(arg0).maxStorageBuffersPerShaderStage;
    return ret;
};
imports.wbg.__wbg_maxStorageTexturesPerShaderStage_6614a1e40f7e2827 = function(arg0) {
    const ret = getObject(arg0).maxStorageTexturesPerShaderStage;
    return ret;
};
imports.wbg.__wbg_maxUniformBuffersPerShaderStage_1ff2f3c6468374ae = function(arg0) {
    const ret = getObject(arg0).maxUniformBuffersPerShaderStage;
    return ret;
};
imports.wbg.__wbg_maxUniformBufferBindingSize_8830a8df4f730637 = function(arg0) {
    const ret = getObject(arg0).maxUniformBufferBindingSize;
    return ret;
};
imports.wbg.__wbg_maxStorageBufferBindingSize_10b6eb49372335bc = function(arg0) {
    const ret = getObject(arg0).maxStorageBufferBindingSize;
    return ret;
};
imports.wbg.__wbg_minUniformBufferOffsetAlignment_0168a0d08b19afbe = function(arg0) {
    const ret = getObject(arg0).minUniformBufferOffsetAlignment;
    return ret;
};
imports.wbg.__wbg_minStorageBufferOffsetAlignment_3b63a59f37f275f8 = function(arg0) {
    const ret = getObject(arg0).minStorageBufferOffsetAlignment;
    return ret;
};
imports.wbg.__wbg_maxVertexBuffers_9f97f2a89863a431 = function(arg0) {
    const ret = getObject(arg0).maxVertexBuffers;
    return ret;
};
imports.wbg.__wbg_maxBufferSize_1c8b836056558ebf = function(arg0) {
    const ret = getObject(arg0).maxBufferSize;
    return ret;
};
imports.wbg.__wbg_maxVertexAttributes_cff466bbace9aa7c = function(arg0) {
    const ret = getObject(arg0).maxVertexAttributes;
    return ret;
};
imports.wbg.__wbg_maxVertexBufferArrayStride_fb650714a5bd0e68 = function(arg0) {
    const ret = getObject(arg0).maxVertexBufferArrayStride;
    return ret;
};
imports.wbg.__wbg_maxInterStageShaderComponents_db659eaa3b248a74 = function(arg0) {
    const ret = getObject(arg0).maxInterStageShaderComponents;
    return ret;
};
imports.wbg.__wbg_maxColorAttachments_e821b856b5cba24e = function(arg0) {
    const ret = getObject(arg0).maxColorAttachments;
    return ret;
};
imports.wbg.__wbg_maxColorAttachmentBytesPerSample_ab770042dd82a5bf = function(arg0) {
    const ret = getObject(arg0).maxColorAttachmentBytesPerSample;
    return ret;
};
imports.wbg.__wbg_maxComputeWorkgroupStorageSize_e6773eb1cbfa7a83 = function(arg0) {
    const ret = getObject(arg0).maxComputeWorkgroupStorageSize;
    return ret;
};
imports.wbg.__wbg_maxComputeInvocationsPerWorkgroup_4ed447998b195973 = function(arg0) {
    const ret = getObject(arg0).maxComputeInvocationsPerWorkgroup;
    return ret;
};
imports.wbg.__wbg_maxComputeWorkgroupSizeX_de94f4925b26c73c = function(arg0) {
    const ret = getObject(arg0).maxComputeWorkgroupSizeX;
    return ret;
};
imports.wbg.__wbg_maxComputeWorkgroupSizeY_cb75de6b450c8915 = function(arg0) {
    const ret = getObject(arg0).maxComputeWorkgroupSizeY;
    return ret;
};
imports.wbg.__wbg_maxComputeWorkgroupSizeZ_6277d18773d70891 = function(arg0) {
    const ret = getObject(arg0).maxComputeWorkgroupSizeZ;
    return ret;
};
imports.wbg.__wbg_maxComputeWorkgroupsPerDimension_baef21641827881d = function(arg0) {
    const ret = getObject(arg0).maxComputeWorkgroupsPerDimension;
    return ret;
};
imports.wbg.__wbg_copyExternalImageToTexture_e192d56d70996ad4 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).copyExternalImageToTexture(getObject(arg1), getObject(arg2), getObject(arg3));
};
imports.wbg.__wbg_submit_4283b63806c5d15e = function(arg0, arg1) {
    getObject(arg0).submit(getObject(arg1));
};
imports.wbg.__wbg_writeBuffer_6ce87bc6ff22a2b5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).writeBuffer(getObject(arg1), arg2, getObject(arg3), arg4, arg5);
};
imports.wbg.__wbg_writeTexture_3708ced0dd386721 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).writeTexture(getObject(arg1), getObject(arg2), getObject(arg3), getObject(arg4));
};
imports.wbg.__wbg_error_520ca6f621497012 = function(arg0) {
    const ret = getObject(arg0).error;
    return addHeapObject(ret);
};
imports.wbg.__wbg_reason_436ee862de561851 = function(arg0) {
    const ret = getObject(arg0).reason;
    return {"unknown":0,"destroyed":1,}[ret] ?? 2;
};
imports.wbg.__wbg_message_54cb97c0fd1579bf = function(arg0, arg1) {
    const ret = getObject(arg1).message;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};
imports.wbg.__wbg_queue_e124eaca54d285d4 = function(arg0) {
    const ret = getObject(arg0).queue;
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_is_object = function(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};
imports.wbg.__wbg_Window_4d1f8d969d639a22 = function(arg0) {
    const ret = getObject(arg0).Window;
    return addHeapObject(ret);
};
imports.wbg.__wbg_WorkerGlobalScope_c4f12290f7d2efed = function(arg0) {
    const ret = getObject(arg0).WorkerGlobalScope;
    return addHeapObject(ret);
};
imports.wbg.__wbg_features_b1971639ec1a77f7 = function(arg0) {
    const ret = getObject(arg0).features;
    return addHeapObject(ret);
};
imports.wbg.__wbg_limits_e806d307d42a9dde = function(arg0) {
    const ret = getObject(arg0).limits;
    return addHeapObject(ret);
};
imports.wbg.__wbg_createShaderModule_cda89eb5c1073627 = function(arg0, arg1) {
    const ret = getObject(arg0).createShaderModule(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_createBindGroupLayout_4243a95be946d48a = function(arg0, arg1) {
    const ret = getObject(arg0).createBindGroupLayout(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_createBindGroup_f93afa3a0a06b10e = function(arg0, arg1) {
    const ret = getObject(arg0).createBindGroup(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_createPipelineLayout_bcb406883550f9cc = function(arg0, arg1) {
    const ret = getObject(arg0).createPipelineLayout(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_createRenderPipeline_7ca396c186d8d06a = function(arg0, arg1) {
    const ret = getObject(arg0).createRenderPipeline(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_createComputePipeline_fb60500f9a96e290 = function(arg0, arg1) {
    const ret = getObject(arg0).createComputePipeline(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_createBuffer_44406243485760b1 = function(arg0, arg1) {
    const ret = getObject(arg0).createBuffer(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_createTexture_06106f81b60e5462 = function(arg0, arg1) {
    const ret = getObject(arg0).createTexture(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_createSampler_ed81ff565caa903a = function(arg0, arg1) {
    const ret = getObject(arg0).createSampler(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_createQuerySet_4040f9ea5a2ac03c = function(arg0, arg1) {
    const ret = getObject(arg0).createQuerySet(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_createCommandEncoder_c7eddb5143f91992 = function(arg0, arg1) {
    const ret = getObject(arg0).createCommandEncoder(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_createRenderBundleEncoder_d9644450ab4cad8f = function(arg0, arg1) {
    const ret = getObject(arg0).createRenderBundleEncoder(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_destroy_2a8c41712abac4cb = function(arg0) {
    getObject(arg0).destroy();
};
imports.wbg.__wbg_lost_02e8ddfb37103cc2 = function(arg0) {
    const ret = getObject(arg0).lost;
    return addHeapObject(ret);
};
imports.wbg.__wbg_setonuncapturederror_c702acc9eeeb9613 = function(arg0, arg1) {
    getObject(arg0).onuncapturederror = getObject(arg1);
};
imports.wbg.__wbg_pushErrorScope_3dc565fa86fee870 = function(arg0, arg1) {
    getObject(arg0).pushErrorScope(["validation","out-of-memory","internal",][arg1]);
};
imports.wbg.__wbg_popErrorScope_6d6b4abc95412374 = function(arg0) {
    const ret = getObject(arg0).popErrorScope();
    return addHeapObject(ret);
};
imports.wbg.__wbg_copyBufferToBuffer_f0736fef84f76be5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).copyBufferToBuffer(getObject(arg1), arg2, getObject(arg3), arg4, arg5);
};
imports.wbg.__wbg_copyBufferToTexture_aedde01ad3786b4f = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).copyBufferToTexture(getObject(arg1), getObject(arg2), getObject(arg3));
};
imports.wbg.__wbg_copyTextureToBuffer_268207d3e09dfa81 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).copyTextureToBuffer(getObject(arg1), getObject(arg2), getObject(arg3));
};
imports.wbg.__wbg_copyTextureToTexture_7ea3d6de0a82ce7f = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).copyTextureToTexture(getObject(arg1), getObject(arg2), getObject(arg3));
};
imports.wbg.__wbg_beginComputePass_df50d9ddd5f32a63 = function(arg0, arg1) {
    const ret = getObject(arg0).beginComputePass(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_beginRenderPass_14284a54cee2063b = function(arg0, arg1) {
    const ret = getObject(arg0).beginRenderPass(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_label_81cb6c4ebcba5f4d = function(arg0, arg1) {
    const ret = getObject(arg1).label;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};
imports.wbg.__wbg_finish_78696a2f194fbb7a = function(arg0, arg1) {
    const ret = getObject(arg0).finish(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_finish_7ad9d3e23124bbc6 = function(arg0) {
    const ret = getObject(arg0).finish();
    return addHeapObject(ret);
};
imports.wbg.__wbg_clearBuffer_a5ccb106665ad51e = function(arg0, arg1, arg2) {
    getObject(arg0).clearBuffer(getObject(arg1), arg2);
};
imports.wbg.__wbg_clearBuffer_f06a69a0aa134d24 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).clearBuffer(getObject(arg1), arg2, arg3);
};
imports.wbg.__wbg_resolveQuerySet_7354946ea63dacbb = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).resolveQuerySet(getObject(arg1), arg2 >>> 0, arg3 >>> 0, getObject(arg4), arg5 >>> 0);
};
imports.wbg.__wbg_finish_5be91110098e071c = function(arg0) {
    const ret = getObject(arg0).finish();
    return addHeapObject(ret);
};
imports.wbg.__wbg_finish_667443ed0047f53a = function(arg0, arg1) {
    const ret = getObject(arg0).finish(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_setPipeline_6174c2e8900fe24a = function(arg0, arg1) {
    getObject(arg0).setPipeline(getObject(arg1));
};
imports.wbg.__wbg_setBindGroup_de4812744c6ebb6c = function(arg0, arg1, arg2) {
    getObject(arg0).setBindGroup(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_setBindGroup_92581920e209bf52 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).setBindGroup(arg1 >>> 0, getObject(arg2), getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
};
imports.wbg.__wbg_setIndexBuffer_91b6f5eb1a43df9b = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).setIndexBuffer(getObject(arg1), ["uint16","uint32",][arg2], arg3);
};
imports.wbg.__wbg_setIndexBuffer_5bce79843be8653d = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).setIndexBuffer(getObject(arg1), ["uint16","uint32",][arg2], arg3, arg4);
};
imports.wbg.__wbg_setVertexBuffer_d9b48c3489dcfa22 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).setVertexBuffer(arg1 >>> 0, getObject(arg2), arg3);
};
imports.wbg.__wbg_setVertexBuffer_330ab505b9dfc64b = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).setVertexBuffer(arg1 >>> 0, getObject(arg2), arg3, arg4);
};
imports.wbg.__wbg_draw_29abcb466fee48b4 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
};
imports.wbg.__wbg_drawIndexed_34b06707991ddaf7 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
};
imports.wbg.__wbg_drawIndirect_0054fe754e8e46e9 = function(arg0, arg1, arg2) {
    getObject(arg0).drawIndirect(getObject(arg1), arg2);
};
imports.wbg.__wbg_drawIndexedIndirect_4b7b51fa979657ca = function(arg0, arg1, arg2) {
    getObject(arg0).drawIndexedIndirect(getObject(arg1), arg2);
};
imports.wbg.__wbg_setPipeline_8f2f5c316ddb7f68 = function(arg0, arg1) {
    getObject(arg0).setPipeline(getObject(arg1));
};
imports.wbg.__wbg_setBindGroup_da48569994113ec3 = function(arg0, arg1, arg2) {
    getObject(arg0).setBindGroup(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_setBindGroup_1c3dd07b998fa943 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).setBindGroup(arg1 >>> 0, getObject(arg2), getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
};
imports.wbg.__wbg_setIndexBuffer_1dc175abfd5d9be9 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).setIndexBuffer(getObject(arg1), ["uint16","uint32",][arg2], arg3);
};
imports.wbg.__wbg_setIndexBuffer_a0fcb26f210351b7 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).setIndexBuffer(getObject(arg1), ["uint16","uint32",][arg2], arg3, arg4);
};
imports.wbg.__wbg_setVertexBuffer_c347f9618d3f056a = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).setVertexBuffer(arg1 >>> 0, getObject(arg2), arg3);
};
imports.wbg.__wbg_setVertexBuffer_40da6368898587db = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).setVertexBuffer(arg1 >>> 0, getObject(arg2), arg3, arg4);
};
imports.wbg.__wbg_draw_a3e2be7a25d4af68 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
};
imports.wbg.__wbg_drawIndexed_f219cccc74b869c5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
};
imports.wbg.__wbg_drawIndirect_23fc0a72c5f1b993 = function(arg0, arg1, arg2) {
    getObject(arg0).drawIndirect(getObject(arg1), arg2);
};
imports.wbg.__wbg_drawIndexedIndirect_6839c0505e2eed2e = function(arg0, arg1, arg2) {
    getObject(arg0).drawIndexedIndirect(getObject(arg1), arg2);
};
imports.wbg.__wbg_setBlendConstant_fd172910ef2cc0c8 = function(arg0, arg1) {
    getObject(arg0).setBlendConstant(getObject(arg1));
};
imports.wbg.__wbg_setScissorRect_915b4534e3936f28 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).setScissorRect(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
};
imports.wbg.__wbg_setViewport_aff318ede051c64e = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).setViewport(arg1, arg2, arg3, arg4, arg5, arg6);
};
imports.wbg.__wbg_setStencilReference_e2bb05496423e92e = function(arg0, arg1) {
    getObject(arg0).setStencilReference(arg1 >>> 0);
};
imports.wbg.__wbg_executeBundles_0f6b9b3accb5b6a7 = function(arg0, arg1) {
    getObject(arg0).executeBundles(getObject(arg1));
};
imports.wbg.__wbg_end_c97b7dbccda72e72 = function(arg0) {
    getObject(arg0).end();
};
imports.wbg.__wbindgen_boolean_get = function(arg0) {
    const v = getObject(arg0);
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};
imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
};
imports.wbg.__wbg_set_f975102236d3c502 = function(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
};
imports.wbg.__wbg_mark_40e050a77cc39fea = function(arg0, arg1) {
    var v0 = getCachedStringFromWasm0(arg0, arg1);
    performance.mark(v0);
};
imports.wbg.__wbg_log_c9486ca5d8e2cbe8 = function(arg0, arg1) {
    var v0 = getCachedStringFromWasm0(arg0, arg1);
if (arg0 !== 0) { wasm.__wbindgen_free(arg0, arg1, 1); }
console.log(v0);
};
imports.wbg.__wbg_measure_aa7a73f17813f708 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
    var v0 = getCachedStringFromWasm0(arg0, arg1);
if (arg0 !== 0) { wasm.__wbindgen_free(arg0, arg1, 1); }
var v1 = getCachedStringFromWasm0(arg2, arg3);
if (arg2 !== 0) { wasm.__wbindgen_free(arg2, arg3, 1); }
performance.measure(v0, v1);
}, arguments) };
imports.wbg.__wbg_log_aba5996d9bde071f = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    var v0 = getCachedStringFromWasm0(arg0, arg1);
if (arg0 !== 0) { wasm.__wbindgen_free(arg0, arg1, 1); }
var v1 = getCachedStringFromWasm0(arg2, arg3);
var v2 = getCachedStringFromWasm0(arg4, arg5);
var v3 = getCachedStringFromWasm0(arg6, arg7);
console.log(v0, v1, v2, v3);
};
imports.wbg.__wbg_performance_a1b8bde2ee512264 = function(arg0) {
    const ret = getObject(arg0).performance;
    return addHeapObject(ret);
};
imports.wbg.__wbg_now_abd80e969af37148 = function(arg0) {
    const ret = getObject(arg0).now();
    return ret;
};
imports.wbg.__wbg_clearInterval_7f51e4380e64c6c5 = function(arg0) {
    const ret = clearInterval(takeObject(arg0));
    return addHeapObject(ret);
};
imports.wbg.__wbg_setInterval_e227d4d8a9d44d66 = function() { return handleError(function (arg0, arg1) {
    const ret = setInterval(getObject(arg0), arg1);
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbindgen_is_falsy = function(arg0) {
    const ret = !getObject(arg0);
    return ret;
};
imports.wbg.__wbg_instanceof_WebGl2RenderingContext_62ccef896d9204fa = function(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof WebGL2RenderingContext;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};
imports.wbg.__wbg_beginQuery_2babccfce9472da4 = function(arg0, arg1, arg2) {
    getObject(arg0).beginQuery(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_bindBufferRange_ec55dd1088960c35 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).bindBufferRange(arg1 >>> 0, arg2 >>> 0, getObject(arg3), arg4, arg5);
};
imports.wbg.__wbg_bindSampler_f251f0dde3843dc4 = function(arg0, arg1, arg2) {
    getObject(arg0).bindSampler(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_bindVertexArray_bec56c40e9ec299d = function(arg0, arg1) {
    getObject(arg0).bindVertexArray(getObject(arg1));
};
imports.wbg.__wbg_blitFramebuffer_cb1261c0e925d363 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
    getObject(arg0).blitFramebuffer(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0);
};
imports.wbg.__wbg_bufferData_f552c26392b9837d = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
};
imports.wbg.__wbg_bufferData_94ce174a81b32961 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferData(arg1 >>> 0, getObject(arg2), arg3 >>> 0);
};
imports.wbg.__wbg_bufferSubData_897bff8bd23ca0b4 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferSubData(arg1 >>> 0, arg2, getObject(arg3));
};
imports.wbg.__wbg_clearBufferfv_bd093a58afda7a8b = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).clearBufferfv(arg1 >>> 0, arg2, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_clearBufferiv_18ffec9d148aaf4b = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).clearBufferiv(arg1 >>> 0, arg2, getArrayI32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_clearBufferuiv_8575fe1b1af9dd15 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).clearBufferuiv(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_clientWaitSync_8d3b836729fa705f = function(arg0, arg1, arg2, arg3) {
    const ret = getObject(arg0).clientWaitSync(getObject(arg1), arg2 >>> 0, arg3 >>> 0);
    return ret;
};
imports.wbg.__wbg_compressedTexSubImage2D_d2201c663eb7e7c0 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9);
};
imports.wbg.__wbg_compressedTexSubImage2D_088b90b29f544ebc = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    getObject(arg0).compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getObject(arg8));
};
imports.wbg.__wbg_compressedTexSubImage3D_8d64b364b8ed6808 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
    getObject(arg0).compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11);
};
imports.wbg.__wbg_compressedTexSubImage3D_d2b94340686bbb79 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
    getObject(arg0).compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, getObject(arg10));
};
imports.wbg.__wbg_copyBufferSubData_026e82b392fb8df2 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
};
imports.wbg.__wbg_copyTexSubImage3D_f2471ef3614db8d4 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).copyTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
};
imports.wbg.__wbg_createQuery_88b1a8cbfaeadcd4 = function(arg0) {
    const ret = getObject(arg0).createQuery();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createSampler_ece1b922a455bd52 = function(arg0) {
    const ret = getObject(arg0).createSampler();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createVertexArray_a3e58c38609ae150 = function(arg0) {
    const ret = getObject(arg0).createVertexArray();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_deleteQuery_deba58de1a061092 = function(arg0, arg1) {
    getObject(arg0).deleteQuery(getObject(arg1));
};
imports.wbg.__wbg_deleteSampler_341b638a62cece3e = function(arg0, arg1) {
    getObject(arg0).deleteSampler(getObject(arg1));
};
imports.wbg.__wbg_deleteSync_ddf848c7dd5cb195 = function(arg0, arg1) {
    getObject(arg0).deleteSync(getObject(arg1));
};
imports.wbg.__wbg_deleteVertexArray_81346dd52e54eb57 = function(arg0, arg1) {
    getObject(arg0).deleteVertexArray(getObject(arg1));
};
imports.wbg.__wbg_drawArraysInstanced_c375d32782ea8d30 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).drawArraysInstanced(arg1 >>> 0, arg2, arg3, arg4);
};
imports.wbg.__wbg_drawBuffers_2744e46ab7e02d91 = function(arg0, arg1) {
    getObject(arg0).drawBuffers(getObject(arg1));
};
imports.wbg.__wbg_drawElementsInstanced_a416af0d12f00837 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).drawElementsInstanced(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
};
imports.wbg.__wbg_endQuery_7e240d815ced0387 = function(arg0, arg1) {
    getObject(arg0).endQuery(arg1 >>> 0);
};
imports.wbg.__wbg_fenceSync_0a54247555048537 = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).fenceSync(arg1 >>> 0, arg2 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_framebufferTextureLayer_1b5119ac136418d2 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).framebufferTextureLayer(arg1 >>> 0, arg2 >>> 0, getObject(arg3), arg4, arg5);
};
imports.wbg.__wbg_getBufferSubData_5e2bbbbd18f18d52 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).getBufferSubData(arg1 >>> 0, arg2, getObject(arg3));
};
imports.wbg.__wbg_getIndexedParameter_edda23e611d65abb = function() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).getIndexedParameter(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_getQueryParameter_ec854b270df79577 = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).getQueryParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_getSyncParameter_cf9ca45e037f34f4 = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).getSyncParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_getUniformBlockIndex_8eef3be68190327f = function(arg0, arg1, arg2, arg3) {
    var v0 = getCachedStringFromWasm0(arg2, arg3);
    const ret = getObject(arg0).getUniformBlockIndex(getObject(arg1), v0);
    return ret;
};
imports.wbg.__wbg_invalidateFramebuffer_12eca43686968fe1 = function() { return handleError(function (arg0, arg1, arg2) {
    getObject(arg0).invalidateFramebuffer(arg1 >>> 0, getObject(arg2));
}, arguments) };
imports.wbg.__wbg_readBuffer_c6e1ba464c45ded1 = function(arg0, arg1) {
    getObject(arg0).readBuffer(arg1 >>> 0);
};
imports.wbg.__wbg_readPixels_f589cb77c7641fb2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    getObject(arg0).readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, getObject(arg7));
}, arguments) };
imports.wbg.__wbg_readPixels_74eff76a8a707954 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    getObject(arg0).readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
}, arguments) };
imports.wbg.__wbg_renderbufferStorageMultisample_1e0f794803ff8352 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).renderbufferStorageMultisample(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
};
imports.wbg.__wbg_samplerParameterf_f58c4ac221503b11 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).samplerParameterf(getObject(arg1), arg2 >>> 0, arg3);
};
imports.wbg.__wbg_samplerParameteri_97baec154acb369e = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).samplerParameteri(getObject(arg1), arg2 >>> 0, arg3);
};
imports.wbg.__wbg_texImage2D_75effcb59fe5da7e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getObject(arg9));
}, arguments) };
imports.wbg.__wbg_texImage3D_335fce191a5faae5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
    getObject(arg0).texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, getObject(arg10));
}, arguments) };
imports.wbg.__wbg_texStorage2D_6143bf0d71e869ce = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).texStorage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
};
imports.wbg.__wbg_texStorage3D_5d6b3c6bfa977000 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).texStorage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6);
};
imports.wbg.__wbg_texSubImage2D_be0166513e368886 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getObject(arg9));
}, arguments) };
imports.wbg.__wbg_texSubImage2D_338d11db84a799ed = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
}, arguments) };
imports.wbg.__wbg_texSubImage2D_bdc1e6e8b1feae8f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getObject(arg9));
}, arguments) };
imports.wbg.__wbg_texSubImage2D_edb828ed3708cfdd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getObject(arg9));
}, arguments) };
imports.wbg.__wbg_texSubImage2D_fbb08177c318e3f2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getObject(arg9));
}, arguments) };
imports.wbg.__wbg_texSubImage3D_c571236e8e9908d5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
    getObject(arg0).texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
}, arguments) };
imports.wbg.__wbg_texSubImage3D_d86e30d5f4ebc0e0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
    getObject(arg0).texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, getObject(arg11));
}, arguments) };
imports.wbg.__wbg_texSubImage3D_b3526f28e3c2031e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
    getObject(arg0).texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, getObject(arg11));
}, arguments) };
imports.wbg.__wbg_texSubImage3D_7a0f4d63809a0f6e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
    getObject(arg0).texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, getObject(arg11));
}, arguments) };
imports.wbg.__wbg_texSubImage3D_9ee350bf3d5e61ad = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
    getObject(arg0).texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, getObject(arg11));
}, arguments) };
imports.wbg.__wbg_uniform1ui_010e62706e661170 = function(arg0, arg1, arg2) {
    getObject(arg0).uniform1ui(getObject(arg1), arg2 >>> 0);
};
imports.wbg.__wbg_uniform2fv_83048fbc79c7f362 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform2fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform2iv_31ff5561a5c51159 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform2iv(getObject(arg1), getArrayI32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform2uiv_4b36f1c57b28c3c6 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform2uiv(getObject(arg1), getArrayU32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform3fv_0ddd3ca056ab3d1f = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform3fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform3iv_eb887b2a339dda97 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform3iv(getObject(arg1), getArrayI32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform3uiv_19cbb50d7afeb7d0 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform3uiv(getObject(arg1), getArrayU32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform4fv_cf977e0dd611bbdd = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform4fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform4iv_b3a606d0b1b87dc9 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform4iv(getObject(arg1), getArrayI32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform4uiv_cb256e285d564825 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform4uiv(getObject(arg1), getArrayU32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniformBlockBinding_744b2ad6a5f2cace = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniformBlockBinding(getObject(arg1), arg2 >>> 0, arg3 >>> 0);
};
imports.wbg.__wbg_uniformMatrix2fv_7e757aaedd0427cf = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix2fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_uniformMatrix2x3fv_91be1a9373d7c5ce = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix2x3fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_uniformMatrix2x4fv_b5ef5b5baced0e4f = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix2x4fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_uniformMatrix3fv_5eec5885a8d5de8b = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix3fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_uniformMatrix3x2fv_88709a0858bab333 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix3x2fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_uniformMatrix3x4fv_184c4f571cff1122 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix3x4fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_uniformMatrix4fv_ae100fc474463355 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix4fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_uniformMatrix4x2fv_e931df9c7cb32d55 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix4x2fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_uniformMatrix4x3fv_f78c83b4908c3e27 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix4x3fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_vertexAttribDivisor_48f4c9ce15c07063 = function(arg0, arg1, arg2) {
    getObject(arg0).vertexAttribDivisor(arg1 >>> 0, arg2 >>> 0);
};
imports.wbg.__wbg_vertexAttribIPointer_78250ec98da971a2 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).vertexAttribIPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
};
imports.wbg.__wbg_activeTexture_067b93df6d1ed857 = function(arg0, arg1) {
    getObject(arg0).activeTexture(arg1 >>> 0);
};
imports.wbg.__wbg_attachShader_396d529f1d7c9abc = function(arg0, arg1, arg2) {
    getObject(arg0).attachShader(getObject(arg1), getObject(arg2));
};
imports.wbg.__wbg_bindAttribLocation_9e7dad25e51f58b1 = function(arg0, arg1, arg2, arg3, arg4) {
    var v0 = getCachedStringFromWasm0(arg3, arg4);
    getObject(arg0).bindAttribLocation(getObject(arg1), arg2 >>> 0, v0);
};
imports.wbg.__wbg_bindBuffer_d6b05e0a99a752d4 = function(arg0, arg1, arg2) {
    getObject(arg0).bindBuffer(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_bindFramebuffer_f5e959313c29a7c6 = function(arg0, arg1, arg2) {
    getObject(arg0).bindFramebuffer(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_bindRenderbuffer_691cb14fc6248155 = function(arg0, arg1, arg2) {
    getObject(arg0).bindRenderbuffer(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_bindTexture_840f7fcfd0298dc4 = function(arg0, arg1, arg2) {
    getObject(arg0).bindTexture(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_blendColor_4c1f00a2e4f1a80d = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).blendColor(arg1, arg2, arg3, arg4);
};
imports.wbg.__wbg_blendEquation_e7b91e8e062fa502 = function(arg0, arg1) {
    getObject(arg0).blendEquation(arg1 >>> 0);
};
imports.wbg.__wbg_blendEquationSeparate_272bfcd932055191 = function(arg0, arg1, arg2) {
    getObject(arg0).blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
};
imports.wbg.__wbg_blendFunc_6a7b81c06098c023 = function(arg0, arg1, arg2) {
    getObject(arg0).blendFunc(arg1 >>> 0, arg2 >>> 0);
};
imports.wbg.__wbg_blendFuncSeparate_f81dd232d266e735 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
};
imports.wbg.__wbg_clear_7a2a7ca897047e8d = function(arg0, arg1) {
    getObject(arg0).clear(arg1 >>> 0);
};
imports.wbg.__wbg_clearDepth_a65e67fdeb1f3ff9 = function(arg0, arg1) {
    getObject(arg0).clearDepth(arg1);
};
imports.wbg.__wbg_clearStencil_1f24aec5432f38ba = function(arg0, arg1) {
    getObject(arg0).clearStencil(arg1);
};
imports.wbg.__wbg_colorMask_7c2aafdec5441392 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
};
imports.wbg.__wbg_compileShader_77ef81728b1c03f6 = function(arg0, arg1) {
    getObject(arg0).compileShader(getObject(arg1));
};
imports.wbg.__wbg_copyTexSubImage2D_d3b3d3b235c88d33 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    getObject(arg0).copyTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
};
imports.wbg.__wbg_createBuffer_7b18852edffb3ab4 = function(arg0) {
    const ret = getObject(arg0).createBuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createFramebuffer_a12847edac092647 = function(arg0) {
    const ret = getObject(arg0).createFramebuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createProgram_73611dc7a72c4ee2 = function(arg0) {
    const ret = getObject(arg0).createProgram();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createRenderbuffer_e7bd95fedc0bbcb5 = function(arg0) {
    const ret = getObject(arg0).createRenderbuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createShader_f10ffabbfd8e2c8c = function(arg0, arg1) {
    const ret = getObject(arg0).createShader(arg1 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createTexture_2426b031baa26a82 = function(arg0) {
    const ret = getObject(arg0).createTexture();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_cullFace_fbafcb7763a2d6aa = function(arg0, arg1) {
    getObject(arg0).cullFace(arg1 >>> 0);
};
imports.wbg.__wbg_deleteBuffer_27b0fb5ed68afbe4 = function(arg0, arg1) {
    getObject(arg0).deleteBuffer(getObject(arg1));
};
imports.wbg.__wbg_deleteFramebuffer_c0d511b2fc07620d = function(arg0, arg1) {
    getObject(arg0).deleteFramebuffer(getObject(arg1));
};
imports.wbg.__wbg_deleteProgram_c3238b647d849334 = function(arg0, arg1) {
    getObject(arg0).deleteProgram(getObject(arg1));
};
imports.wbg.__wbg_deleteRenderbuffer_325417b497c5ae27 = function(arg0, arg1) {
    getObject(arg0).deleteRenderbuffer(getObject(arg1));
};
imports.wbg.__wbg_deleteShader_da06706168cf00dc = function(arg0, arg1) {
    getObject(arg0).deleteShader(getObject(arg1));
};
imports.wbg.__wbg_deleteTexture_cdd844345a2559bb = function(arg0, arg1) {
    getObject(arg0).deleteTexture(getObject(arg1));
};
imports.wbg.__wbg_depthFunc_2f1df7eb8339f5a3 = function(arg0, arg1) {
    getObject(arg0).depthFunc(arg1 >>> 0);
};
imports.wbg.__wbg_depthMask_a301dd9951c6056c = function(arg0, arg1) {
    getObject(arg0).depthMask(arg1 !== 0);
};
imports.wbg.__wbg_depthRange_85c249bf5c81856c = function(arg0, arg1, arg2) {
    getObject(arg0).depthRange(arg1, arg2);
};
imports.wbg.__wbg_disable_8908871f2334e76b = function(arg0, arg1) {
    getObject(arg0).disable(arg1 >>> 0);
};
imports.wbg.__wbg_disableVertexAttribArray_79a5010f18eb84cb = function(arg0, arg1) {
    getObject(arg0).disableVertexAttribArray(arg1 >>> 0);
};
imports.wbg.__wbg_drawArrays_7a8f5031b1fe80ff = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).drawArrays(arg1 >>> 0, arg2, arg3);
};
imports.wbg.__wbg_enable_541ed84c1e7d269d = function(arg0, arg1) {
    getObject(arg0).enable(arg1 >>> 0);
};
imports.wbg.__wbg_enableVertexAttribArray_06043f51b716ed9d = function(arg0, arg1) {
    getObject(arg0).enableVertexAttribArray(arg1 >>> 0);
};
imports.wbg.__wbg_framebufferRenderbuffer_f7c592ad40667f89 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, getObject(arg4));
};
imports.wbg.__wbg_framebufferTexture2D_5b524fe6135d5fe8 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, getObject(arg4), arg5);
};
imports.wbg.__wbg_frontFace_54ccf43770ae1011 = function(arg0, arg1) {
    getObject(arg0).frontFace(arg1 >>> 0);
};
imports.wbg.__wbg_getExtension_095ef1e6c9d8d8ab = function() { return handleError(function (arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).getExtension(v0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_getParameter_cfaed180705b9280 = function() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).getParameter(arg1 >>> 0);
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_getProgramInfoLog_fe796f3a9512a8e3 = function(arg0, arg1, arg2) {
    const ret = getObject(arg1).getProgramInfoLog(getObject(arg2));
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};
imports.wbg.__wbg_getProgramParameter_9df6cbbb1343b27d = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).getProgramParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_getShaderInfoLog_a7ca51b89a4dafab = function(arg0, arg1, arg2) {
    const ret = getObject(arg1).getShaderInfoLog(getObject(arg2));
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};
imports.wbg.__wbg_getShaderParameter_806970126d526c29 = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).getShaderParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_getSupportedExtensions_e1788ac835b7e81a = function(arg0) {
    const ret = getObject(arg0).getSupportedExtensions();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_getUniformLocation_6a59ad54df3bba8e = function(arg0, arg1, arg2, arg3) {
    var v0 = getCachedStringFromWasm0(arg2, arg3);
    const ret = getObject(arg0).getUniformLocation(getObject(arg1), v0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_linkProgram_56a5d97f63b1f56d = function(arg0, arg1) {
    getObject(arg0).linkProgram(getObject(arg1));
};
imports.wbg.__wbg_pixelStorei_3a600280eab03e3c = function(arg0, arg1, arg2) {
    getObject(arg0).pixelStorei(arg1 >>> 0, arg2);
};
imports.wbg.__wbg_polygonOffset_ebf1b1bd8db53e65 = function(arg0, arg1, arg2) {
    getObject(arg0).polygonOffset(arg1, arg2);
};
imports.wbg.__wbg_renderbufferStorage_3c5e469d82dfe89b = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
};
imports.wbg.__wbg_scissor_2b172ca4e459dd16 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).scissor(arg1, arg2, arg3, arg4);
};
imports.wbg.__wbg_shaderSource_b92b2b5c29126344 = function(arg0, arg1, arg2, arg3) {
    var v0 = getCachedStringFromWasm0(arg2, arg3);
    getObject(arg0).shaderSource(getObject(arg1), v0);
};
imports.wbg.__wbg_stencilFuncSeparate_25b5dd967d72b6e5 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).stencilFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3, arg4 >>> 0);
};
imports.wbg.__wbg_stencilMask_702162181d88081f = function(arg0, arg1) {
    getObject(arg0).stencilMask(arg1 >>> 0);
};
imports.wbg.__wbg_stencilMaskSeparate_1f803a440e789b81 = function(arg0, arg1, arg2) {
    getObject(arg0).stencilMaskSeparate(arg1 >>> 0, arg2 >>> 0);
};
imports.wbg.__wbg_stencilOpSeparate_52b401966f916a0f = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).stencilOpSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
};
imports.wbg.__wbg_texParameteri_531d0268109950ba = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
};
imports.wbg.__wbg_uniform1f_81b570bf6358ae6c = function(arg0, arg1, arg2) {
    getObject(arg0).uniform1f(getObject(arg1), arg2);
};
imports.wbg.__wbg_uniform1i_ded3be13f5d8f11a = function(arg0, arg1, arg2) {
    getObject(arg0).uniform1i(getObject(arg1), arg2);
};
imports.wbg.__wbg_uniform4f_bdbb7cf56fc94cbb = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).uniform4f(getObject(arg1), arg2, arg3, arg4, arg5);
};
imports.wbg.__wbg_useProgram_001c6b9208b683d3 = function(arg0, arg1) {
    getObject(arg0).useProgram(getObject(arg1));
};
imports.wbg.__wbg_vertexAttribPointer_b435a034ff758637 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
};
imports.wbg.__wbg_viewport_536c78dd69c44351 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).viewport(arg1, arg2, arg3, arg4);
};
imports.wbg.__wbg_namespaceURI_d27c7f3638dd2926 = function(arg0, arg1) {
    const ret = getObject(arg1).namespaceURI;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};
imports.wbg.__wbg_setinnerHTML_ea7e3c6a3c4790c6 = function(arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    getObject(arg0).innerHTML = v0;
};
imports.wbg.__wbg_removeAttribute_c80e298b60689065 = function() { return handleError(function (arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    getObject(arg0).removeAttribute(v0);
}, arguments) };
imports.wbg.__wbg_setAttribute_d5540a19be09f8dc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    var v1 = getCachedStringFromWasm0(arg3, arg4);
    getObject(arg0).setAttribute(v0, v1);
}, arguments) };
imports.wbg.__wbg_before_ac3792b457802cbf = function() { return handleError(function (arg0, arg1) {
    getObject(arg0).before(getObject(arg1));
}, arguments) };
imports.wbg.__wbg_remove_5b68b70c39041e2a = function(arg0) {
    getObject(arg0).remove();
};
imports.wbg.__wbg_visibilityState_51f5bb37c843e94e = function(arg0) {
    const ret = getObject(arg0).visibilityState;
    return {"hidden":0,"visible":1,}[ret] ?? 2;
};
imports.wbg.__wbg_createComment_7a1d9856e50567bb = function(arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).createComment(v0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_createDocumentFragment_5d919bd9d2e05b55 = function(arg0) {
    const ret = getObject(arg0).createDocumentFragment();
    return addHeapObject(ret);
};
imports.wbg.__wbg_createElement_5921e9eb06b9ec89 = function() { return handleError(function (arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).createElement(v0);
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_createTextNode_8bce33cf33bf8f6e = function(arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).createTextNode(v0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_getElementById_f56c8e6a15a6926d = function(arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).getElementById(v0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_querySelector_e21c39150aa72078 = function() { return handleError(function (arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).querySelector(v0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_querySelectorAll_52447cbab6df8bae = function() { return handleError(function (arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).querySelectorAll(v0);
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_instanceof_Window_5012736c80a01584 = function(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Window;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};
imports.wbg.__wbg_document_8554450897a855b9 = function(arg0) {
    const ret = getObject(arg0).document;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_navigator_6210380287bf8581 = function(arg0) {
    const ret = getObject(arg0).navigator;
    return addHeapObject(ret);
};
imports.wbg.__wbg_getComputedStyle_ba4609b39055f674 = function() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).getComputedStyle(getObject(arg1));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_clearTimeout_25cdc2ed88b3c0b2 = function(arg0, arg1) {
    getObject(arg0).clearTimeout(arg1);
};
imports.wbg.__wbg_setTimeout_73b734ca971c19f4 = function() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).setTimeout(getObject(arg1), arg2);
    return ret;
}, arguments) };
imports.wbg.__wbg_instanceof_HtmlCanvasElement_1a96a01603ec2d8b = function(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof HTMLCanvasElement;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};
imports.wbg.__wbg_width_53a5bd0268e99485 = function(arg0) {
    const ret = getObject(arg0).width;
    return ret;
};
imports.wbg.__wbg_setwidth_e371a8d6b16ebe84 = function(arg0, arg1) {
    getObject(arg0).width = arg1 >>> 0;
};
imports.wbg.__wbg_height_6fb32e51e54037ae = function(arg0) {
    const ret = getObject(arg0).height;
    return ret;
};
imports.wbg.__wbg_setheight_ba99ad2df4295e89 = function(arg0, arg1) {
    getObject(arg0).height = arg1 >>> 0;
};
imports.wbg.__wbg_getContext_69ec873410cbba3c = function() { return handleError(function (arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).getContext(v0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_getContext_70d493702d2b8f3e = function() { return handleError(function (arg0, arg1, arg2, arg3) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).getContext(v0, getObject(arg3));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_framebufferTextureMultiviewOVR_32295d56731dd362 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).framebufferTextureMultiviewOVR(arg1 >>> 0, arg2 >>> 0, getObject(arg3), arg4, arg5, arg6);
};
imports.wbg.__wbg_contentRect_c1a9045c459744d9 = function(arg0) {
    const ret = getObject(arg0).contentRect;
    return addHeapObject(ret);
};
imports.wbg.__wbg_borderBoxSize_692fda7b4e3b97f1 = function(arg0) {
    const ret = getObject(arg0).borderBoxSize;
    return addHeapObject(ret);
};
imports.wbg.__wbg_contentBoxSize_a2d93ded171ea1de = function(arg0) {
    const ret = getObject(arg0).contentBoxSize;
    return addHeapObject(ret);
};
imports.wbg.__wbg_devicePixelContentBoxSize_8d531ca6a4331b28 = function(arg0) {
    const ret = getObject(arg0).devicePixelContentBoxSize;
    return addHeapObject(ret);
};
imports.wbg.__wbg_bufferData_fc33089cf05a6c5a = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
};
imports.wbg.__wbg_bufferData_0db2a74470353a96 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferData(arg1 >>> 0, getObject(arg2), arg3 >>> 0);
};
imports.wbg.__wbg_bufferSubData_944883045753ee61 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).bufferSubData(arg1 >>> 0, arg2, getObject(arg3));
};
imports.wbg.__wbg_compressedTexSubImage2D_678be4671393a94b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    getObject(arg0).compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getObject(arg8));
};
imports.wbg.__wbg_readPixels_0c5ad23c72dbe1b8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    getObject(arg0).readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, getObject(arg7));
}, arguments) };
imports.wbg.__wbg_texImage2D_d704e7eee22d1e6b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getObject(arg9));
}, arguments) };
imports.wbg.__wbg_texSubImage2D_bed4633ee03b384d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    getObject(arg0).texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getObject(arg9));
}, arguments) };
imports.wbg.__wbg_uniform2fv_b73144e507d90a92 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform2fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform2iv_27f3fc3aefa41fa7 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform2iv(getObject(arg1), getArrayI32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform3fv_5df1d945c0bbfe20 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform3fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform3iv_03be54fcc4468fc4 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform3iv(getObject(arg1), getArrayI32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform4fv_d87e4ea9ef6cf6de = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform4fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniform4iv_965df9fa4c8ab47e = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).uniform4iv(getObject(arg1), getArrayI32FromWasm0(arg2, arg3));
};
imports.wbg.__wbg_uniformMatrix2fv_8646addaa18ba00b = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix2fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_uniformMatrix3fv_917f07d03e8b1db5 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix3fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_uniformMatrix4fv_46c1f9033bbb1a5e = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).uniformMatrix4fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
};
imports.wbg.__wbg_activeTexture_b967ed47a8083daa = function(arg0, arg1) {
    getObject(arg0).activeTexture(arg1 >>> 0);
};
imports.wbg.__wbg_attachShader_2b5810fc1d23ebe7 = function(arg0, arg1, arg2) {
    getObject(arg0).attachShader(getObject(arg1), getObject(arg2));
};
imports.wbg.__wbg_bindAttribLocation_0018ec2a523f139f = function(arg0, arg1, arg2, arg3, arg4) {
    var v0 = getCachedStringFromWasm0(arg3, arg4);
    getObject(arg0).bindAttribLocation(getObject(arg1), arg2 >>> 0, v0);
};
imports.wbg.__wbg_bindBuffer_1f581c747176e7d7 = function(arg0, arg1, arg2) {
    getObject(arg0).bindBuffer(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_bindFramebuffer_8cba9964befd2a6d = function(arg0, arg1, arg2) {
    getObject(arg0).bindFramebuffer(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_bindRenderbuffer_297ae310683dc32b = function(arg0, arg1, arg2) {
    getObject(arg0).bindRenderbuffer(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_bindTexture_bffa89324927e23a = function(arg0, arg1, arg2) {
    getObject(arg0).bindTexture(arg1 >>> 0, getObject(arg2));
};
imports.wbg.__wbg_blendColor_c876d94aa784bef7 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).blendColor(arg1, arg2, arg3, arg4);
};
imports.wbg.__wbg_blendEquation_4f3b8eb0b07cab21 = function(arg0, arg1) {
    getObject(arg0).blendEquation(arg1 >>> 0);
};
imports.wbg.__wbg_blendEquationSeparate_95241ffd0f6ab09e = function(arg0, arg1, arg2) {
    getObject(arg0).blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
};
imports.wbg.__wbg_blendFunc_f31d0f0d227137e0 = function(arg0, arg1, arg2) {
    getObject(arg0).blendFunc(arg1 >>> 0, arg2 >>> 0);
};
imports.wbg.__wbg_blendFuncSeparate_2b607032f14b9381 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
};
imports.wbg.__wbg_clear_780c4e5384fe3fc6 = function(arg0, arg1) {
    getObject(arg0).clear(arg1 >>> 0);
};
imports.wbg.__wbg_clearDepth_92f7c7d02e50df24 = function(arg0, arg1) {
    getObject(arg0).clearDepth(arg1);
};
imports.wbg.__wbg_clearStencil_78b0b3c82001b542 = function(arg0, arg1) {
    getObject(arg0).clearStencil(arg1);
};
imports.wbg.__wbg_colorMask_6a64eb75df60e2cf = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
};
imports.wbg.__wbg_compileShader_043cc8b99c2efc21 = function(arg0, arg1) {
    getObject(arg0).compileShader(getObject(arg1));
};
imports.wbg.__wbg_copyTexSubImage2D_8f6644e7df89a307 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    getObject(arg0).copyTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
};
imports.wbg.__wbg_createBuffer_9571c039ba6696c6 = function(arg0) {
    const ret = getObject(arg0).createBuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createFramebuffer_20f79ec189ef2060 = function(arg0) {
    const ret = getObject(arg0).createFramebuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createProgram_2c3a8969b5a76988 = function(arg0) {
    const ret = getObject(arg0).createProgram();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createRenderbuffer_620bdfb7867926e8 = function(arg0) {
    const ret = getObject(arg0).createRenderbuffer();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createShader_af087106532661d9 = function(arg0, arg1) {
    const ret = getObject(arg0).createShader(arg1 >>> 0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_createTexture_e49c36c5f31925a3 = function(arg0) {
    const ret = getObject(arg0).createTexture();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_cullFace_ccad99c645b704eb = function(arg0, arg1) {
    getObject(arg0).cullFace(arg1 >>> 0);
};
imports.wbg.__wbg_deleteBuffer_898974b9db136e43 = function(arg0, arg1) {
    getObject(arg0).deleteBuffer(getObject(arg1));
};
imports.wbg.__wbg_deleteFramebuffer_d632dfba2c1f5c75 = function(arg0, arg1) {
    getObject(arg0).deleteFramebuffer(getObject(arg1));
};
imports.wbg.__wbg_deleteProgram_5f938b0667141206 = function(arg0, arg1) {
    getObject(arg0).deleteProgram(getObject(arg1));
};
imports.wbg.__wbg_deleteRenderbuffer_ccae7372581ae424 = function(arg0, arg1) {
    getObject(arg0).deleteRenderbuffer(getObject(arg1));
};
imports.wbg.__wbg_deleteShader_b9bb71cfb1a65a0d = function(arg0, arg1) {
    getObject(arg0).deleteShader(getObject(arg1));
};
imports.wbg.__wbg_deleteTexture_558c751a66bd2f16 = function(arg0, arg1) {
    getObject(arg0).deleteTexture(getObject(arg1));
};
imports.wbg.__wbg_depthFunc_5398fbc3f56db827 = function(arg0, arg1) {
    getObject(arg0).depthFunc(arg1 >>> 0);
};
imports.wbg.__wbg_depthMask_9b58af067c6393e9 = function(arg0, arg1) {
    getObject(arg0).depthMask(arg1 !== 0);
};
imports.wbg.__wbg_depthRange_29f0e12388f0eacb = function(arg0, arg1, arg2) {
    getObject(arg0).depthRange(arg1, arg2);
};
imports.wbg.__wbg_disable_d73e59fee5b5e973 = function(arg0, arg1) {
    getObject(arg0).disable(arg1 >>> 0);
};
imports.wbg.__wbg_disableVertexAttribArray_b9d8ae826c70526f = function(arg0, arg1) {
    getObject(arg0).disableVertexAttribArray(arg1 >>> 0);
};
imports.wbg.__wbg_drawArrays_532f4e0a4547dd1f = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).drawArrays(arg1 >>> 0, arg2, arg3);
};
imports.wbg.__wbg_enable_68b3fa03a633259a = function(arg0, arg1) {
    getObject(arg0).enable(arg1 >>> 0);
};
imports.wbg.__wbg_enableVertexAttribArray_52c23a516be565c0 = function(arg0, arg1) {
    getObject(arg0).enableVertexAttribArray(arg1 >>> 0);
};
imports.wbg.__wbg_framebufferRenderbuffer_fee6ceb2330389b7 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, getObject(arg4));
};
imports.wbg.__wbg_framebufferTexture2D_ae81a33228e46de6 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, getObject(arg4), arg5);
};
imports.wbg.__wbg_frontFace_358bf8c6c5159d54 = function(arg0, arg1) {
    getObject(arg0).frontFace(arg1 >>> 0);
};
imports.wbg.__wbg_getParameter_8df84a84197f2148 = function() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).getParameter(arg1 >>> 0);
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_getProgramInfoLog_22296c36addf7a70 = function(arg0, arg1, arg2) {
    const ret = getObject(arg1).getProgramInfoLog(getObject(arg2));
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};
imports.wbg.__wbg_getProgramParameter_ab2954ca517d8589 = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).getProgramParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_getShaderInfoLog_935361c52a919c15 = function(arg0, arg1, arg2) {
    const ret = getObject(arg1).getShaderInfoLog(getObject(arg2));
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};
imports.wbg.__wbg_getShaderParameter_cedb1ec0d8052eff = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).getShaderParameter(getObject(arg1), arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_getUniformLocation_9cd213015cf8f29f = function(arg0, arg1, arg2, arg3) {
    var v0 = getCachedStringFromWasm0(arg2, arg3);
    const ret = getObject(arg0).getUniformLocation(getObject(arg1), v0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_linkProgram_1f18bca817bb6edb = function(arg0, arg1) {
    getObject(arg0).linkProgram(getObject(arg1));
};
imports.wbg.__wbg_pixelStorei_2498331e094ff305 = function(arg0, arg1, arg2) {
    getObject(arg0).pixelStorei(arg1 >>> 0, arg2);
};
imports.wbg.__wbg_polygonOffset_6d8d69a8d60e5b82 = function(arg0, arg1, arg2) {
    getObject(arg0).polygonOffset(arg1, arg2);
};
imports.wbg.__wbg_renderbufferStorage_8c3882aa73deada9 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
};
imports.wbg.__wbg_scissor_d06b14c4966727fa = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).scissor(arg1, arg2, arg3, arg4);
};
imports.wbg.__wbg_shaderSource_d447b31057e4f64c = function(arg0, arg1, arg2, arg3) {
    var v0 = getCachedStringFromWasm0(arg2, arg3);
    getObject(arg0).shaderSource(getObject(arg1), v0);
};
imports.wbg.__wbg_stencilFuncSeparate_55376d035e74caf1 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).stencilFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3, arg4 >>> 0);
};
imports.wbg.__wbg_stencilMask_f55f160fc49b981a = function(arg0, arg1) {
    getObject(arg0).stencilMask(arg1 >>> 0);
};
imports.wbg.__wbg_stencilMaskSeparate_578fd1281f54081e = function(arg0, arg1, arg2) {
    getObject(arg0).stencilMaskSeparate(arg1 >>> 0, arg2 >>> 0);
};
imports.wbg.__wbg_stencilOpSeparate_ea6f96abd32aae5b = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).stencilOpSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
};
imports.wbg.__wbg_texParameteri_83ad7181b62f4997 = function(arg0, arg1, arg2, arg3) {
    getObject(arg0).texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
};
imports.wbg.__wbg_uniform1f_509b4ba100d75456 = function(arg0, arg1, arg2) {
    getObject(arg0).uniform1f(getObject(arg1), arg2);
};
imports.wbg.__wbg_uniform1i_7f6e60c975d21e0a = function(arg0, arg1, arg2) {
    getObject(arg0).uniform1i(getObject(arg1), arg2);
};
imports.wbg.__wbg_uniform4f_f9a7809965964840 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).uniform4f(getObject(arg1), arg2, arg3, arg4, arg5);
};
imports.wbg.__wbg_useProgram_d4616618ac6d0652 = function(arg0, arg1) {
    getObject(arg0).useProgram(getObject(arg1));
};
imports.wbg.__wbg_vertexAttribPointer_fcbfe42523d724ca = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
    getObject(arg0).vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
};
imports.wbg.__wbg_viewport_efc09c09d4f3cc48 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).viewport(arg1, arg2, arg3, arg4);
};
imports.wbg.__wbg_getSupportedProfiles_13c2c2008a14070f = function(arg0) {
    const ret = getObject(arg0).getSupportedProfiles();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_setroot_3a59b120768920f0 = function(arg0, arg1) {
    getObject(arg0).root = getObject(arg1);
};
imports.wbg.__wbg_setrootmargin_4ea242969f495111 = function(arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    getObject(arg0).rootMargin = v0;
};
imports.wbg.__wbg_setthreshold_6358e559cd1d7399 = function(arg0, arg1) {
    getObject(arg0).threshold = getObject(arg1);
};
imports.wbg.__wbg_parentNode_3e06cf96d7693d57 = function(arg0) {
    const ret = getObject(arg0).parentNode;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_childNodes_031aa96d5e3d21b0 = function(arg0) {
    const ret = getObject(arg0).childNodes;
    return addHeapObject(ret);
};
imports.wbg.__wbg_previousSibling_076df2178284ef97 = function(arg0) {
    const ret = getObject(arg0).previousSibling;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_nextSibling_f6396d6fd0b97830 = function(arg0) {
    const ret = getObject(arg0).nextSibling;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_appendChild_ac45d1abddf1b89b = function() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).appendChild(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_cloneNode_629a1b180e91c467 = function() { return handleError(function (arg0) {
    const ret = getObject(arg0).cloneNode();
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_length_4919f4a62b9b1e94 = function(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};
imports.wbg.__wbg_get_fe289e3950b3978a = function(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_setcapture_4818ebe9ef88b2f6 = function(arg0, arg1) {
    getObject(arg0).capture = arg1 !== 0;
};
imports.wbg.__wbg_setonce_06b35a72a3fafc15 = function(arg0, arg1) {
    getObject(arg0).once = arg1 !== 0;
};
imports.wbg.__wbg_setpassive_70ce6704aec553f6 = function(arg0, arg1) {
    getObject(arg0).passive = arg1 !== 0;
};
imports.wbg.__wbg_drawArraysInstancedANGLE_7c668fc363789760 = function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).drawArraysInstancedANGLE(arg1 >>> 0, arg2, arg3, arg4);
};
imports.wbg.__wbg_drawElementsInstancedANGLE_7d0baa058556f76c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
    getObject(arg0).drawElementsInstancedANGLE(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
};
imports.wbg.__wbg_vertexAttribDivisorANGLE_ff0ade84fc10084b = function(arg0, arg1, arg2) {
    getObject(arg0).vertexAttribDivisorANGLE(arg1 >>> 0, arg2 >>> 0);
};
imports.wbg.__wbg_addEventListener_e167f012cbedfa4e = function() { return handleError(function (arg0, arg1, arg2, arg3) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    getObject(arg0).addEventListener(v0, getObject(arg3));
}, arguments) };
imports.wbg.__wbg_addEventListener_14b036ff7cb8747c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    getObject(arg0).addEventListener(v0, getObject(arg3), getObject(arg4));
}, arguments) };
imports.wbg.__wbg_removeEventListener_f19508a45d20bda3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    getObject(arg0).removeEventListener(v0, getObject(arg3), getObject(arg4));
}, arguments) };
imports.wbg.__wbg_drawBuffersWEBGL_ff53a7c3360f5716 = function(arg0, arg1) {
    getObject(arg0).drawBuffersWEBGL(getObject(arg1));
};
imports.wbg.__wbg_warn_2b3adb99ce26c314 = function(arg0) {
    console.warn(getObject(arg0));
};
imports.wbg.__wbg_boundingClientRect_7dae1bf95734dbd9 = function(arg0) {
    const ret = getObject(arg0).boundingClientRect;
    return addHeapObject(ret);
};
imports.wbg.__wbg_isIntersecting_7cba11b732bde6a7 = function(arg0) {
    const ret = getObject(arg0).isIntersecting;
    return ret;
};
imports.wbg.__wbg_target_b7cb1739bee70928 = function(arg0) {
    const ret = getObject(arg0).target;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_cancelBubble_0374b329f66f59b5 = function(arg0) {
    const ret = getObject(arg0).cancelBubble;
    return ret;
};
imports.wbg.__wbg_composedPath_d1052062308beae5 = function(arg0) {
    const ret = getObject(arg0).composedPath();
    return addHeapObject(ret);
};
imports.wbg.__wbg_offsetX_e7047852d4b4b482 = function(arg0) {
    const ret = getObject(arg0).offsetX;
    return ret;
};
imports.wbg.__wbg_offsetY_76fc66e0e449645e = function(arg0) {
    const ret = getObject(arg0).offsetY;
    return ret;
};
imports.wbg.__wbg_bindVertexArrayOES_37868a5a4265ea0a = function(arg0, arg1) {
    getObject(arg0).bindVertexArrayOES(getObject(arg1));
};
imports.wbg.__wbg_createVertexArrayOES_84334a02da216381 = function(arg0) {
    const ret = getObject(arg0).createVertexArrayOES();
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_deleteVertexArrayOES_e22f7a6baedc5300 = function(arg0, arg1) {
    getObject(arg0).deleteVertexArrayOES(getObject(arg1));
};
imports.wbg.__wbg_inlineSize_322ab111c2b5c9e3 = function(arg0) {
    const ret = getObject(arg0).inlineSize;
    return ret;
};
imports.wbg.__wbg_blockSize_981c4dfa6e1263a8 = function(arg0) {
    const ret = getObject(arg0).blockSize;
    return ret;
};
imports.wbg.__wbg_append_d510a297e3ba948e = function() { return handleError(function (arg0, arg1) {
    getObject(arg0).append(getObject(arg1));
}, arguments) };
imports.wbg.__wbg_width_e7964a50b174d035 = function(arg0) {
    const ret = getObject(arg0).width;
    return ret;
};
imports.wbg.__wbg_height_cd5c897b4d3fabe3 = function(arg0) {
    const ret = getObject(arg0).height;
    return ret;
};
imports.wbg.__wbg_videoWidth_5f4190ae93af0dd6 = function(arg0) {
    const ret = getObject(arg0).videoWidth;
    return ret;
};
imports.wbg.__wbg_videoHeight_4fb4bdd27e02263a = function(arg0) {
    const ret = getObject(arg0).videoHeight;
    return ret;
};
imports.wbg.__wbg_width_151910f38d746773 = function(arg0) {
    const ret = getObject(arg0).width;
    return ret;
};
imports.wbg.__wbg_height_c1b4ecc1cfed30aa = function(arg0) {
    const ret = getObject(arg0).height;
    return ret;
};
imports.wbg.__wbg_navigator_db73b5b11a0c5c93 = function(arg0) {
    const ret = getObject(arg0).navigator;
    return addHeapObject(ret);
};
imports.wbg.__wbg_close_cef2400b120c9c73 = function() { return handleError(function (arg0) {
    getObject(arg0).close();
}, arguments) };
imports.wbg.__wbg_enqueue_6f3d433b5e457aea = function() { return handleError(function (arg0, arg1) {
    getObject(arg0).enqueue(getObject(arg1));
}, arguments) };
imports.wbg.__wbg_new_42acb42ec2ace97c = function() { return handleError(function (arg0) {
    const ret = new ResizeObserver(getObject(arg0));
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_disconnect_1dbf7e19d9590abd = function(arg0) {
    getObject(arg0).disconnect();
};
imports.wbg.__wbg_observe_60f3631b2f7c6d8b = function(arg0, arg1, arg2) {
    getObject(arg0).observe(getObject(arg1), getObject(arg2));
};
imports.wbg.__wbg_getPropertyValue_b0f0858c3b5f17dd = function() { return handleError(function (arg0, arg1, arg2, arg3) {
    var v0 = getCachedStringFromWasm0(arg2, arg3);
    const ret = getObject(arg1).getPropertyValue(v0);
    const ptr2 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len2, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr2, true);
}, arguments) };
imports.wbg.__wbg_setbox_0d838a2d268b7fac = function(arg0, arg1) {
    getObject(arg0).box = ["border-box","content-box","device-pixel-content-box",][arg1];
};
imports.wbg.__wbg_instanceof_HtmlElement_ee6cb55e6b90ae79 = function(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof HTMLElement;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};
imports.wbg.__wbg_newwithoptions_a923614b576cc032 = function() { return handleError(function (arg0, arg1) {
    const ret = new IntersectionObserver(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_disconnect_24e89f8d65ad2fd5 = function(arg0) {
    getObject(arg0).disconnect();
};
imports.wbg.__wbg_observe_c901133fbef21560 = function(arg0, arg1) {
    getObject(arg0).observe(getObject(arg1));
};
imports.wbg.__wbg_byobRequest_b32c77640da946ac = function(arg0) {
    const ret = getObject(arg0).byobRequest;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_close_aca7442e6619206b = function() { return handleError(function (arg0) {
    getObject(arg0).close();
}, arguments) };
imports.wbg.__wbg_setdata_27c6828c5a5a5ce4 = function(arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    getObject(arg0).data = v0;
};
imports.wbg.__wbg_width_a7c8cb533b26f0bf = function(arg0) {
    const ret = getObject(arg0).width;
    return ret;
};
imports.wbg.__wbg_setwidth_c20f1f8fcd5d93b4 = function(arg0, arg1) {
    getObject(arg0).width = arg1 >>> 0;
};
imports.wbg.__wbg_height_affa017f56a8fb96 = function(arg0) {
    const ret = getObject(arg0).height;
    return ret;
};
imports.wbg.__wbg_setheight_a5e39c9d97429299 = function(arg0, arg1) {
    getObject(arg0).height = arg1 >>> 0;
};
imports.wbg.__wbg_getContext_bd2ece8a59fd4732 = function() { return handleError(function (arg0, arg1, arg2) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).getContext(v0);
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_getContext_76f1b45238db4411 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
    var v0 = getCachedStringFromWasm0(arg1, arg2);
    const ret = getObject(arg0).getContext(v0, getObject(arg3));
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_view_2a901bda0727aeb3 = function(arg0) {
    const ret = getObject(arg0).view;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};
imports.wbg.__wbg_respond_a799bab31a44f2d7 = function() { return handleError(function (arg0, arg1) {
    getObject(arg0).respond(arg1 >>> 0);
}, arguments) };
imports.wbg.__wbg_instanceof_ShadowRoot_72d8e783f8e0093c = function(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof ShadowRoot;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};
imports.wbg.__wbg_host_fdfe1258b06fe937 = function(arg0) {
    const ret = getObject(arg0).host;
    return addHeapObject(ret);
};
imports.wbg.__wbg_queueMicrotask_48421b3cc9052b68 = function(arg0) {
    const ret = getObject(arg0).queueMicrotask;
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_is_function = function(arg0) {
    const ret = typeof(getObject(arg0)) === 'function';
    return ret;
};
imports.wbg.__wbg_queueMicrotask_12a30234db4045d3 = function(arg0) {
    queueMicrotask(getObject(arg0));
};
imports.wbg.__wbg_get_3baa728f9d58d3f6 = function(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return addHeapObject(ret);
};
imports.wbg.__wbg_length_ae22078168b726f5 = function(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};
imports.wbg.__wbg_new_a220cf903aa02ca2 = function() {
    const ret = new Array();
    return addHeapObject(ret);
};
imports.wbg.__wbg_newnoargs_76313bd6ff35d0f2 = function(arg0, arg1) {
    var v0 = getCachedStringFromWasm0(arg0, arg1);
    const ret = new Function(v0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_get_224d16597dbbfd96 = function() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_call_1084a111329e68ce = function() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_new_525245e2b9901204 = function() {
    const ret = new Object();
    return addHeapObject(ret);
};
imports.wbg.__wbg_self_3093d5d1f7bcb682 = function() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_window_3bcfc4d31bc012f8 = function() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_globalThis_86b222e13bdf32ed = function() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_global_e5a3fe56f8be9485 = function() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_includes_7c12264f911567fe = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).includes(getObject(arg1), arg2);
    return ret;
};
imports.wbg.__wbg_of_4a1c869ef05b4b73 = function(arg0) {
    const ret = Array.of(getObject(arg0));
    return addHeapObject(ret);
};
imports.wbg.__wbg_push_37c89022f34c01ca = function(arg0, arg1) {
    const ret = getObject(arg0).push(getObject(arg1));
    return ret;
};
imports.wbg.__wbg_new_796382978dfd4fb0 = function(arg0, arg1) {
    var v0 = getCachedStringFromWasm0(arg0, arg1);
    const ret = new Error(v0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_call_89af060b4e1523f2 = function() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };
imports.wbg.__wbg_now_b7a162010a9e75b4 = function() {
    const ret = Date.now();
    return ret;
};
imports.wbg.__wbg_instanceof_Object_b80213ae6cc9aafb = function(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Object;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};
imports.wbg.__wbg_is_009b1ef508712fda = function(arg0, arg1) {
    const ret = Object.is(getObject(arg0), getObject(arg1));
    return ret;
};
imports.wbg.__wbg_valueOf_d5ba0a54a2aa5615 = function(arg0) {
    const ret = getObject(arg0).valueOf();
    return addHeapObject(ret);
};
imports.wbg.__wbg_new_b85e72ed1bfd57f9 = function(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_1070(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return addHeapObject(ret);
    } finally {
        state0.a = state0.b = 0;
    }
};
imports.wbg.__wbg_resolve_570458cb99d56a43 = function(arg0) {
    const ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};
imports.wbg.__wbg_then_95e6edc0f89b73b1 = function(arg0, arg1) {
    const ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};
imports.wbg.__wbg_then_876bb3c633745cc6 = function(arg0, arg1, arg2) {
    const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};
imports.wbg.__wbg_buffer_b7b08af79b0b0974 = function(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};
imports.wbg.__wbg_newwithbyteoffsetandlength_634ada0fd17e2e96 = function(arg0, arg1, arg2) {
    const ret = new Int8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_newwithbyteoffsetandlength_b5293b0eedbac651 = function(arg0, arg1, arg2) {
    const ret = new Int16Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_newwithbyteoffsetandlength_c89d62ca194b7f14 = function(arg0, arg1, arg2) {
    const ret = new Int32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_newwithbyteoffsetandlength_8a2cb9ca96b27ec9 = function(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_new_ea1883e1e5e86686 = function(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};
imports.wbg.__wbg_set_d1e79e2388520f18 = function(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};
imports.wbg.__wbg_length_8339fcf5d8ecd12e = function(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};
imports.wbg.__wbg_newwithbyteoffsetandlength_bd3d5191e8925067 = function(arg0, arg1, arg2) {
    const ret = new Uint16Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_newwithbyteoffsetandlength_874df3e29cb555f9 = function(arg0, arg1, arg2) {
    const ret = new Uint32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_newwithbyteoffsetandlength_a69c63d7671a5dbf = function(arg0, arg1, arg2) {
    const ret = new Float32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};
imports.wbg.__wbg_buffer_0710d1b9dbe2eea6 = function(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};
imports.wbg.__wbg_byteLength_850664ef28f3e42f = function(arg0) {
    const ret = getObject(arg0).byteLength;
    return ret;
};
imports.wbg.__wbg_byteOffset_ea14c35fa6de38cc = function(arg0) {
    const ret = getObject(arg0).byteOffset;
    return ret;
};
imports.wbg.__wbg_set_eacc7d73fefaafdf = function() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
}, arguments) };
imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};
imports.wbg.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};
imports.wbg.__wbindgen_rethrow = function(arg0) {
    throw takeObject(arg0);
};
imports.wbg.__wbindgen_memory = function() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper1123 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 398, __wbg_adapter_40);
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper1129 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 398, __wbg_adapter_43);
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper1130 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 398, __wbg_adapter_43);
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper1131 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 398, __wbg_adapter_48);
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper1135 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 398, __wbg_adapter_43);
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper3554 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1608, __wbg_adapter_53);
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper3556 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1608, __wbg_adapter_53);
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper6631 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2702, __wbg_adapter_58);
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper6633 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2702, __wbg_adapter_61);
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper6646 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2714, __wbg_adapter_64);
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper6718 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2736, __wbg_adapter_67);
    return addHeapObject(ret);
};
imports.wbg.__wbindgen_closure_wrapper9297 = function(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2768, __wbg_adapter_70);
    return addHeapObject(ret);
};

return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedInt32ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined' && Object.getPrototypeOf(module) === Object.prototype)
    ({module} = module)
    else
    console.warn('using deprecated parameters for `initSync()`; pass a single object instead')

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined' && Object.getPrototypeOf(module_or_path) === Object.prototype)
    ({module_or_path} = module_or_path)
    else
    console.warn('using deprecated parameters for the initialization function; pass a single object instead')

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('shade-rs-ui_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
