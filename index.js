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
      accept: '.el:not(.droppedEl)', // 드롭 영역에 이미 존재하는 요소는 드롭 불가능
      drop: function(event, ui) {
          const draggedEl = $(ui.helper).clone(); //  드래그한 요소 복제
          draggedEl.append('<div class="el-content"></div>'); // 내용이 들어갈 영역 추가
          draggedEl.append('<div class="delete-icon">×</div>');
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
      const detailBtn = $('<div class="edit-btn">상세 보기</div>');
      $(this).append(detailBtn);
  });

  $(document).on('mouseleave', '.droppedEl', function() {
      $(this).find('.edit-btn').remove();
  });

  // 상세 보기 모달
  $(document).on('click', '.edit-btn', function() {
      // 모달 요소 생성
      const modal = $(
          '<div class="content-modal">' +
              '<div class="content">' +
                  '<div class="textarea"></div>' +
                  '<div class="modal-btn">' +
                      '<button class="update-btn">수정</button>' +
                      '<button class="close-btn">닫기</button>' +
                  '</div>' +
              '</div>' +
          '</div>'
      );
      $('body').append(modal);

      // 모달 드래그 설정
      $('.content').draggable({
          containment: '.drop-area', 
          // 내용을 작성하는 부분과 저장, 취소 버튼은 드래그에서 제외
          cancel: '.note-editing-area, .modal-btn button',
          start: function(event, ui) {
              $(this).css('cursor', 'move');
          },
          stop: function(event, ui) {
              $(this).css('cursor', 'default');
          }
      });

      const targetEl = $(this).closest('.droppedEl'); // 내용을 수정할 대상 요소
      const prevContent = targetEl.find('.el-content').html(); // 기존 내용
      $('.textarea').html(prevContent);
      detailModalBtn();

      // 내용이 없을 경우 수정 버튼 클릭
      if (!prevContent) {
          $('.update-btn').click();
      }

      // 내용 수정 모달 버튼 함수 (저장, 취소)
      function updateModalBtn() {
          // 저장 버튼 클릭 시 내용 저장
          $('.save-btn').on('click', function() {
            const content = $('.textarea').summernote('code');
            targetEl.find('.el-content').html(content);
            $('.content-modal').remove();
            saveElData(targetEl); // 로컬 스토리지에 저장
          });
        
          // 취소 버튼 클릭 시 상세 보기 화면으로 이동
          $('.cancel-btn').on('click', function() {

          // 이전 내용이 없는데 수정 취소를 클릭한 경우
          if (!prevContent) {
              $('.content-modal').remove(); // 모달 닫기
              return;
          }

          const detailModal = $(
              '<div class="textarea"></div>' +
              '<div class="modal-btn">' +
                  '<button class="update-btn">수정</button>' +
                  '<button class="close-btn">닫기</button>' +
              '</div>'
          );
          $('.content').html(detailModal);
          $('.textarea').html(prevContent);
          detailModalBtn();
        });
      }

      // 상세 보기 모달 버튼 함수 (수정, 닫기)
      function detailModalBtn() {
          // 수정 버튼 클릭 시 내용 수정 화면으로 이동
          $('.update-btn').on('click', function() {
              const updateModal = $(
                  '<h2>내용 수정</h2>' +
                  '<div class="textarea"></div>' +
                  '<div class="modal-btn">' +
                      '<button class="save-btn">저장</button>' +
                      '<button class="cancel-btn">취소</button>' +
                  '</div>'
              );
              $('.content').html(updateModal);
              updateModalBtn();
    
              // summernote 초기화
              $('.textarea').summernote({
                  height: 250,
                  focus: true
              }).summernote('code', prevContent);
          });

          // 닫기 버튼 클릭 시 모달 닫기
          $('.close-btn').on('click', function() {
              $('.content-modal').remove();
          });
      }
    });

    // 삭제 아이콘 클릭 시 요소 삭제
    $(document).on('click', '.delete-icon', function() {
        const targetEl = $(this).closest('.droppedEl');
        const content = targetEl.find('.el-content').html();
  
        if (!content) targetEl.remove();
        else {
            if (confirm('로컬 스토리지에서 요소가 완전히 삭제됩니다. \n정말 삭제하시겠습니까?')) {
              localStorage.removeItem(targetEl.attr('id')); // 로컬 스토리지에서 요소 삭제
              targetEl.remove(); // 화면에서 요소 삭제
            }
        }
    });
});

// 로컬 스토리지에 요소를 저장하는 함수
function saveElData(el) {
    const elId = el.attr('id');
    const content = el.find('.el-content').html();
    
    // 내용이 없으면 저장하지 않음
    if (!content) return;
    
    const elData = {
        id: elId,
        left: el.css('left'),
        top: el.css('top'),
        width: el.css('width'),
        height: el.css('height'),
        content: content
    };
    localStorage.setItem(elId, JSON.stringify(elData)); // JSON으로 변환
}

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
      savedEl.append('<div class="delete-icon">×</div>');

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
          containment: '.drop-area', 
          stop: function(event, ui) {
              saveElData($(this));
          }
      }).resizable({
          aspectRatio: true, 
          maxWidth: 150, 
          maxHeight: 150, 
          minWidth: 70, 
          minHeight: 70, 
          autoHide: true, 
          stop: function(event, ui) {
              $(ui.helper).find('.ui-resizable-handle').hide();
              saveElData($(this));
          }
      });
      $('.drop-area').append(savedEl); // 드롭 영역에 요소 추가
  });
}