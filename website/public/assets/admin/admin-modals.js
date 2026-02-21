/**
 * Shared Admin Modals - View Modal, Import Modal & Markdown Editor Modal
 * Eliminates HTML duplication across communities.html, organizations.html, and stories.html
 */

/**
 * Inject the View Details Modal HTML into the page.
 * Used by communities.html, organizations.html, and stories.html.
 *
 * @param {string} title - The default title (e.g. 'Community Details', 'Provider Details')
 */
function injectViewModal(title) {
    if (document.getElementById('viewModal')) return; // already injected

    const html = `
    <div id="viewModal" class="modal view-modal" style="display: none;">
        <div class="modal-content">
            <div class="view-header" id="viewModalHeader">
                <div class="drag-handle" title="Drag to move">
                    <i class="fa-solid fa-grip-vertical"></i>
                </div>
                <div style="flex: 1;">
                    <h2 id="viewTitle">${title}</h2>
                    <span id="viewStatus" class="status-indicator"></span>
                </div>
                <button onclick="closeViewModal()" class="btn-close" style="color: white;">&times;</button>
            </div>
            <div class="view-body" id="viewBody">
                <!-- Content will be dynamically loaded -->
            </div>
            <div class="resize-handle" title="Drag to resize"></div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
}

/**
 * Inject the Import Modal HTML into the page.
 * Used by communities.html and organizations.html.
 * Requires: excel-import.js for functionality (showImportModal, closeImportModal, etc.)
 */
function injectImportModal() {
    if (document.getElementById('importModal')) return; // already injected

    const html = `
    <div id="importModal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2><i class="fa-solid fa-file-import"></i> Import from Excel</h2>
                <button onclick="closeImportModal()" class="btn-close">&times;</button>
            </div>
            <div class="modal-body">
                <div id="uploadArea" style="
                    border: 2px dashed #B9C98A;
                    border-radius: 8px;
                    padding: 3rem;
                    text-align: center;
                    cursor: pointer;
                    transition: border-color 0.3s ease, background 0.3s ease;
                    background: #FAF6E8;
                ">
                    <i class="fa-solid fa-cloud-arrow-up" style="font-size: 3rem; color: #B9C98A; margin-bottom: 1rem;"></i>
                    <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Drop Excel file here or click to browse</p>
                    <p style="font-size: 0.9rem; color: #666;">Supports .xlsx files exported from this system</p>
                    <input type="file" id="fileInput" accept=".xlsx" style="display: none;" />
                </div>

                <div id="validationResults" style="display: none; margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem;">Validation Results</h3>
                    <div id="validationStats" style="
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                    "></div>
                    <div id="errorsList"></div>
                </div>

                <div id="importActions" style="display: none; margin-top: 2rem; gap: 0.75rem;">
                    <button type="button" id="downloadErrorsBtn" onclick="downloadErrorLog()" class="btn-secondary" style="display: none;">
                        <i class="fa-solid fa-download"></i> Download Error Log
                    </button>
                    <button type="button" id="executeImportBtn" onclick="executeImport()" class="btn-primary">
                        <i class="fa-solid fa-check"></i> Import Valid Rows
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
}

/**
 * Inject a Markdown Editor Modal into the page.
 * Used by communities.html and stories.html.
 *
 * @param {Object} config
 * @param {string} config.modalId - ID for the modal container (e.g. 'storyModal', 'editorModal')
 * @param {string} config.headerId - ID for the modal header (for drag support)
 * @param {string} config.textareaId - ID for the editor textarea
 * @param {string} config.previewId - ID for the preview pane
 * @param {string} config.placeholder - Placeholder text for the textarea
 * @param {string} config.saveLabel - Label for the save button (e.g. 'Save Story', 'Save Content')
 * @param {string} config.onSave - Name of the global save function to call
 * @param {string} config.onClose - Name of the global close function to call
 */
function injectMarkdownEditor(config) {
    if (document.getElementById(config.modalId)) return; // already injected

    const html = `
    <div id="${config.modalId}" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 1000px; max-height: 90vh;">
            <div class="modal-header" id="${config.headerId}">
                <div class="drag-handle" title="Drag to move">
                    <i class="fa-solid fa-grip-vertical"></i>
                </div>
                <h2><i class="fa-solid fa-pen-to-square"></i> Story Editor (Markdown)</h2>
                <button onclick="${config.onClose}()" class="btn-close">&times;</button>
            </div>
            <div class="modal-body" style="padding: 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; height: 70vh;">
                    <!-- Editor Pane -->
                    <div style="border-right: 1px solid #e0e0e0; display: flex; flex-direction: column;">
                        <div style="padding: 1rem; border-bottom: 1px solid #e0e0e0; background: #f8f9fa;">
                            <h3 style="margin: 0; font-size: 1rem; color: var(--color-text-light);">
                                <i class="fa-solid fa-pen"></i> Markdown Editor
                            </h3>
                            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #999;">
                                <code>**bold**</code> <code>*italic*</code> <code>[link](url)</code> <code># heading</code>
                            </div>
                        </div>
                        <textarea id="${config.textareaId}" style="
                            flex: 1;
                            width: 100%;
                            border: none;
                            padding: 1.5rem;
                            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
                            font-size: 0.95rem;
                            line-height: 1.6;
                            resize: none;
                        " placeholder="${config.placeholder}"></textarea>
                    </div>

                    <!-- Preview Pane -->
                    <div style="display: flex; flex-direction: column; background: #fafafa;">
                        <div style="padding: 1rem; border-bottom: 1px solid #e0e0e0; background: #f8f9fa;">
                            <h3 style="margin: 0; font-size: 1rem; color: var(--color-text-light);">
                                <i class="fa-solid fa-eye"></i> Preview
                            </h3>
                        </div>
                        <div id="${config.previewId}" style="
                            flex: 1;
                            overflow-y: auto;
                            padding: 1.5rem;
                            line-height: 1.7;
                        ">
                            <p style="color: #999; font-style: italic;">Preview will appear here...</p>
                        </div>
                    </div>
                </div>
                <div style="padding: 1.5rem; border-top: 1px solid #e0e0e0; background: white; display: flex; justify-content: flex-end; gap: 0.75rem;">
                    <button type="button" onclick="${config.onClose}()" class="btn-secondary">Cancel</button>
                    <button type="button" onclick="${config.onSave}()" class="btn-primary">${config.saveLabel}</button>
                </div>
            </div>
            <div class="resize-handle" title="Drag to resize"></div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
}
