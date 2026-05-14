package com.coresolution.consultation.dto.community;

import com.coresolution.consultation.constant.CommunityModerationStatus;
import com.coresolution.consultation.constant.CommunityPostKind;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * 어드민 검수 큐 항목.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CommunityModerationQueueItemResponse {

    long id;
    CommunityPostKind postKind;
    CommunityModerationStatus moderationStatus;
    String title;
    String bodyPreview;
    long authorUserId;
    String authorDisplay;
    boolean anonymous;
    String specialty;
    String createdAt;
}
