$(document).ready(async function() {
    // 로컬 스토리지에 저장된 요소 불러오기
    await getElData();
    
    // 요소 생성 시 드래그 설정
    $('.el:not([id])').draggable({
        helper: 'clone', // 복제된 요소 드래그
        start: function(event, ui) {
            ui.helper.css({
                transform: 'scale(1.7)' // 요소 확대
            });
        }
    });

    // 드롭 영역 설정
    $('.drop-area').droppable({
        tolerance: 'fit', // 요소 전체가 드롭 영역 안에 완전히 들어와야 함
        drop: function(event, ui) {
            // 드래그한 요소가 이미 영역 내에 있으면 return
            if ($(ui.helper).hasClass('droppedEl')) return;

            const draggedEl = $(ui.helper).clone(); //  드래그한 요소 복제
            draggedEl.append('<div class="el-content"></div>'); // 내용이 들어갈 영역 추가
            draggedEl.addClass('droppedEl');

            // 요소에 ID 지정
            const elId = 'el-' + Date.now();
            draggedEl.attr('id', elId);

            draggedEl.css({
                position: 'absolute',
                // 드롭 위치에 따라 X, Y 좌표 설정
                left: Math.max(0, Math.min(ui.offset.left - $(this).offset().left, $(this).width() - draggedEl.width() * 2)), 
                top: Math.max(0, Math.min(ui.offset.top - $(this).offset().top, $(this).height() - draggedEl.height() * 2))
            }).draggable({
                containment: '.drop-area' // 영역 내에서만 드래그 가능
            }).resizable({
                // 크기 조절 설정
                aspectRatio: true, // 비율 유지
                maxWidth: 150, 
                maxHeight: 150, 
                minWidth: 70, 
                minHeight: 70, 
                autoHide: true, // 마우스 hover 시에만 크기 조절 핸들 보이도록 설정
                stop: function(event, ui) {
                    // 크기 조절이 끝난 후 핸들을 명시적으로 숨김
                    $(ui.helper).find('.ui-resizable-handle').hide();
                }
            });
            $(this).append(draggedEl); // 영역에 복제한 요소 추가
        }
    });

    $(document).on('mouseenter', '.droppedEl', function() {
        const editBtn = $('<div class="edit-btn">내용 수정하기</div>');
        $(this).append(editBtn);
    });

    $(document).on('mouseleave', '.droppedEl', function() {
        $(this).find('.edit-btn').remove();
    });

    // 내용 작성 모달
    $(document).on('click', '.edit-btn', function() {
        const targetEl = $(this).closest('.droppedEl'); // 내용을 수정할 대상 요소
        
        // 모달 요소 생성
        const modal = $(
            '<div class="content-modal">' +
                '<div class="content">' +
                    '<h2>내용 작성</h2>' +
                    '<div class="textarea"></div>' +
                    '<div class="modal-btn">' +
                        '<button class="save-btn">저장</button>' +
                        '<button class="cancel-btn">취소</button>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
        $('body').append(modal);

        // summernote 초기화
        const prevContent = targetEl.find('.el-content').html(); // 기존 내용
        $('.textarea').summernote({
            height: 250, 
            focus: true
        }).summernote('code', prevContent);

        // 저장 버튼 클릭 시 내용 저장
        $('.save-btn').on('click', function() {
            const content = $('.textarea').summernote('code');
            targetEl.find('.el-content').html(content);
            $('.content-modal').remove();
            
            // 로컬 스토리지에 요소 저장
            const elId = targetEl.attr('id');
            const elData = {
                id: elId,
                left: targetEl.css('left'), 
                top: targetEl.css('top'), 
                width: targetEl.css('width'), 
                height: targetEl.css('height'), 
                content: content
            };
            localStorage.setItem(elId, JSON.stringify(elData)); // JSON으로 변환
        });

        // 모달 닫기
        $('.cancel-btn').on('click', function() {
            $('.content-modal').remove();
        });
    });
});

// 로컬 스토리지에서 이전에 저장된 요소 데이터를 가져와
// 드롭 영역에 추가하는 함수
async function getElData() {
    // 로컬 스토리지에 저장된 요소 데이터를 담는 배열
    const saveData = [];
    for (let key in localStorage) {
        if (!key.startsWith('el-')) continue; // 다른 로컬 스토리지 데이터 제외
        const value = JSON.parse(localStorage.getItem(key)); // 객체로 변환
        saveData.push(value);
    }

    saveData.forEach(function(item) {
        const savedEl = $('<div class="el droppedEl"></div>');
        savedEl.append('<div class="el-content"></div>');

        // 생성한 요소에 값, 이벤트 세팅
        savedEl.attr('id', item.id);
        savedEl.find('.el-content').html(item.content);
        savedEl.css({
            position: 'absolute', 
            left: item.left, 
            top: item.top, 
            width: item.width, 
            height: item.height, 
            transform: 'scale(1.7)'
        }).draggable({
            containment: '.drop-area'
        }).resizable({
            aspectRatio: true, 
            maxWidth: 150, 
            maxHeight: 150, 
            minWidth: 70, 
            minHeight: 70, 
            autoHide: true, 
            stop: function(event, ui) {
                $(ui.helper).find('.ui-resizable-handle').hide();
            }
        });
        $('.drop-area').append(savedEl); // 드롭 영역에 요소 추가
    });
}